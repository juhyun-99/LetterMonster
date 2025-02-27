import os
import shutil
import uuid
import logging
import boto3

from botocore.exceptions import ClientError
from fastapi import APIRouter
from pathlib import Path
from starlette.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from PIL import Image, ImageSequence
from AnimatedDrawings.examples.image_to_animation import image_to_animation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

env = os.getenv('ENV', 'dev')
load_dotenv(f'.env.{env}')

# S3 설정
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv("CREDENTIALS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("CREDENTIALS_SECRET_KEY")
)


class CharacterCreateRequest(BaseModel):
    character_id: str
    motion_name: str
    img_url: str


@router.post("/create")
async def create_character(request: CharacterCreateRequest):
    character_id = request.character_id
    motion = request.motion_name
    s3_img_url = request.img_url

    try:
        gif_path = await create_gif(character_id, motion, s3_img_url)
        if gif_path:
            return JSONResponse(content={"gif_path": gif_path}, status_code=200)

    except Exception as e:
        logger.error("create_gif => 에러", exc_info=True)
        return JSONResponse(content={"Fast API 에러": str(e)}, status_code=500)


async def create_gif(character_id: str, motion: str, s3_img_url: str):
    IMG_DIR = "temp_image"
    GIF_DIR = "temp_gif"
    try:
        # 이미지 저장 경로
        Path(IMG_DIR).mkdir(exist_ok=True)

        # s3에서 이미지 다운로드
        is_downloaded = await get_img_s3(s3_img_url)

        if not is_downloaded:
            return JSONResponse(content={"error": "Fast API 에러 : s3 이미지 다운로드 실패"}, status_code=500)

        image_path = f"temp_image/{s3_img_url}"

        # 이미지 압축
        # image_compressed = await img_compress(image_path, f'temp_image/compressed_{s3_img_url}')
        
        # if image_compressed:
        #     print("이미지 압축 성공")
        #     image_path = f'temp_image/compressed_{s3_img_url}'

        # GIF 저장 경로
        gif_dir_name = f"{str(uuid.uuid4())}"
        Path(GIF_DIR).mkdir(exist_ok=True)

        gif_path = os.path.join(GIF_DIR, gif_dir_name)

        # motion config 절대경로 불러오기
        motion_cfg_fn = os.path.abspath(f'AnimatedDrawings/examples/config/motion/{motion}.yaml')

        # retarget config 절대경로 불러오기
        if motion in ["jumping", "zombie", "hi", "stand", "dab_dance", "super"]:
            retarget_cfg_fn = os.path.abspath('AnimatedDrawings/examples/config/retarget/fair1_ppf.yaml')

        elif motion == "jumping_jacks":
            retarget_cfg_fn = os.path.abspath('AnimatedDrawings/examples/config/retarget/cmu1_pfp.yaml')

        else:
            retarget_cfg_fn = os.path.abspath('AnimatedDrawings/examples/config/retarget/mixamo_fff.yaml')

        # animated drawings 함수 호출
        image_to_animation(image_path, gif_path, motion_cfg_fn, retarget_cfg_fn, character_id, motion)

        # gif 압축
        is_compressed = await gif_compress(
            original_path=gif_path + f"/{character_id}_{motion}.gif",
            compressed_path=gif_path + f"/{character_id}_{motion}_compressed.gif"
        )

        if not is_compressed:
            print("압축 실패")
            return JSONResponse(content={"error": "Fast API 에러 : s3 gif 업로드 실패"}, status_code=500)

        # S3에 gif 업로드
        is_saved = await save_gif_s3(gif_path, character_id, motion)

        if not is_saved:
            return JSONResponse(content={"error": "Fast API 에러 : s3 gif 업로드 실패"}, status_code=500)

        s3_path = f'{os.getenv("S3_PATH")}/{character_id}_{motion}.gif'

        return s3_path

    finally:
        # print("")
        shutil.rmtree(IMG_DIR)
        shutil.rmtree(GIF_DIR)


# S3에서 img 불러오기
async def get_img_s3(s3_img_url):
    try:
        s3.download_file(
            Bucket=os.getenv("S3_BUCKET"),
            Key=f'{os.getenv("S3_PATH")}/{s3_img_url}',  # 다운로드할 파일
            Filename=f"temp_image/{s3_img_url}"  # 로컬 저장 경로
        )
        print("s3 다운로드 성공")

        return True

    except Exception as e:
        logger.error("get_img_s3 => 에러 발생", exc_info=True)
        return False


# S3에 gif 저장하기
async def save_gif_s3(gif_path, character_id, motion):
    try:
        s3.upload_file(
            Bucket=os.getenv("S3_BUCKET"),
            Filename=gif_path + f'/{character_id}_{motion}_compressed.gif',  # 업로드할 파일
            Key=f'{os.getenv("S3_PATH")}/{character_id}_{motion}.gif',  # s3 저장 경로
            ExtraArgs={'ContentType': 'image/gif'}
        )
        print("s3 업로드 성공")
        return True

    except Exception as e:
        logger.error("save_gif_s3 => 에러 발생", exc_info=True)
        return False


# 이미지 압축
async def img_compress(original_path, compressed_path, quality=0.5):
    try:
        with Image.open(original_path) as origin:
            img = origin.resize((int(origin.width * quality), int(origin.height * quality)), Image.Resampling.LANCZOS)
            img.save(compressed_path)
        print("압축 성공")
        return True

    except Exception as e:
        logger.error("img_compress => 에러 발생", exc_info=True)
        return False


# gif 압축
async def gif_compress(original_path, compressed_path, quality=0.7):
    try:
        with Image.open(original_path) as origin:
            # 프레임 목록 추출
            frames = [frame.copy() for frame in ImageSequence.Iterator(origin)]

            # 각 프레임을 조정하여 크기를 줄임
            compressed_frames = [
                frame.resize((int(frame.width * quality), int(frame.height * quality)), Image.Resampling.LANCZOS)
                for frame in frames
            ]

            # 새 프레임을 gif로 저장
            compressed_frames[0].save(
                compressed_path,
                save_all=True,
                append_images=compressed_frames[1:],
                optimize=False,
                duration=origin.info['duration'],
                loop=origin.info['loop'],
                disposal=2
            )
            print("압축 성공")
            return True

    except Exception as e:
        logger.error("gif_compress => 에러 발생", exc_info=True)
        return False