import { useNavigate, useParams } from "react-router-dom";
import styles from "./SketchbookPage.module.scss";
import useSketchbook, {
  useDeleteSketchbook,
  usePutSketchbook,
  usePutSketchbookOpen,
} from "../../../hooks/sketchbook/useSketchbook";
import DefaultButton from "../../atoms/button/DefaultButton";
import { useEffect, useState } from "react";
import { Page_Url } from "../../../router/Page_Url";
import LNB from "../../molecules/common/LNB";
import Letter from "../../atoms/letter/Letter";
import { useTranslation } from "react-i18next";
import { useAlert } from "../../../hooks/notice/useAlert";
import WriteButton from "../../atoms/button/WriteLetterButton";
import Modal from "../../atoms/modal/Modal";
import { useQueryClient } from "@tanstack/react-query";

function SketchbookPage() {
  const { t } = useTranslation();
  const params = useParams() as { uuid: string };
  const { data, isLoading } = useSketchbook(params.uuid);
  const navigate = useNavigate();
  const [now, setNow] = useState(-1);
  const [letter, setLetter] = useState(0);
  const [name, setName] = useState(data?.data?.name);
  const { showAlert } = useAlert();
  const mutateSketchbookName = usePutSketchbook();
  const deleteSketchbook = useDeleteSketchbook();
  const mutateSketchbookOpen = usePutSketchbookOpen();
  const queryClient = useQueryClient();

  useEffect(() => {
    setName(data?.data?.name);

    // 클린업 함수
    return () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["sketchbook"] });
    };
  }, [data, setName]);

  type ModalName = "sketchbookInfo" | "letter" | "deleteAlert" | "renameAlert";

  const [isModalOpen, setModalOpen] = useState({
    sketchbookInfo: false,
    letter: false,
    deleteAlert: false,
    renameAlert: false,
  });

  const handleToggleModal = (modalName: ModalName, index: number) => {
    if (data?.data?.sketchbookCharacterMotionList[now]?.letterList === null) {
      return showAlert("비회원은 편지를 못봐요");
    }
    if (now === -1 || index === now) {
      setModalOpen((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
    } else if (index !== now) {
      setNow(index);
      setLetter(0);
      if (!isModalOpen.letter) {
        setModalOpen((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
      }
    }
  };

  const letterButton = (value: number) => {
    if (data) {
      const len =
        data?.data?.sketchbookCharacterMotionList[now].letterList.length;
      if (letter + value >= 0 && letter + value < len) {
        setLetter(letter + value);
      }
    }
  };

  const handleUserNicknameChange = (nickname: string) => {
    if (nickname.startsWith(" ")) {
      showAlert("첫 글자로 띄어쓰기를 사용할 수 없습니다.");
    } else if (
      /[^a-zA-Z0-9ㄱ-힣\s]/.test(nickname) ||
      nickname.includes("　")
    ) {
      showAlert("스케치북 이름은 영문, 숫자, 한글만 가능합니다.");
    } else if (nickname.length > 10) {
      showAlert("스케치북 이름은 10글자 이하만 가능합니다.");
    } else {
      mutateSketchbookName.mutate({ sketchbookId: data?.data?.id, name: name });
      handleToggleModal("sketchbookInfo", 0);
      handleToggleModal("renameAlert", 0);
    }
  };

  const writeLetter = () =>
    navigate(`${Page_Url.WriteLetterToSketchbook}${data?.data?.id}`, {
      state: { sketchbookName: data?.data?.name },
    });

  const inputEnter = (
    e:
      | React.KeyboardEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleUserNicknameChange(name);
    }
  };

  return (
    <>
      <article className={styles.sketchbookContainer}>
        <LNB>
          {data && (
            <h1
              onClick={() => {
                if (
                  localStorage.getItem("acceesToken") &&
                  data?.data?.isWritePossible
                )
                  handleToggleModal("sketchbookInfo", 0);
              }}
            >{`${data?.data?.name} ▼ ${
              data?.data?.isPublic ? "공개중" : "비공개중"
            }`}</h1>
          )}
          <DefaultButton onClick={() => writeLetter()} custom={true}>
            {t("sketchbook.letter")}
          </DefaultButton>
        </LNB>
        <WriteButton id="writeButton" onClick={() => writeLetter()} />
        {data && (
          <figure className={styles.sketchbook}>
            {isModalOpen?.letter &&
              data?.data?.sketchbookCharacterMotionList[now]?.letterList && (
                <div className={styles.letterBox}>
                  <Letter
                    sender={
                      data?.data?.sketchbookCharacterMotionList[now]
                        ?.letterList?.[letter]?.sender?.nickname
                    }
                    content={
                      data?.data?.sketchbookCharacterMotionList[now]
                        ?.letterList?.[letter]?.content
                    }
                  ></Letter>
                  <div className={styles.letterButtons}>
                    <DefaultButton
                      onClick={() => letterButton(-1)}
                      custom={true}
                    >
                      {"<"}
                    </DefaultButton>
                    <DefaultButton
                      onClick={() => letterButton(1)}
                      custom={true}
                    >
                      {">"}
                    </DefaultButton>
                  </div>
                </div>
              )}
            <div className={styles.characterGrid}>
              {!isLoading &&
                data?.data?.sketchbookCharacterMotionList?.map(
                  (item: any, i: number) => (
                    <DefaultButton
                      key={i}
                      onClick={() => {
                        setNow(i);
                        handleToggleModal("letter", i);
                      }}
                      custom={true}
                    >
                      <img src={item?.characterMotion?.imageUrl} />
                      <div>{item?.characterMotion?.nickname}</div>
                    </DefaultButton>
                  )
                )}
            </div>
          </figure>
        )}
        {isModalOpen.sketchbookInfo && (
          <Modal
            isOpen={isModalOpen.sketchbookInfo}
            onClose={() => handleToggleModal("sketchbookInfo", 0)}
          >
            <div className={styles.buttonBox}>
              <DefaultButton
                onClick={() => handleToggleModal("renameAlert", 0)}
              >
                {t("sketchbook.rename")}
              </DefaultButton>
              <DefaultButton
                onClick={() => handleToggleModal("deleteAlert", 0)}
              >
                {t("sketchbook.delete")}
              </DefaultButton>
              <DefaultButton
                onClick={() => {
                  mutateSketchbookOpen.mutate(data?.data?.id);
                  handleToggleModal("sketchbookInfo", 0);
                }}
              >
                {data?.data?.isPublic ? "링크로만 공개" : "모두에게 공개"}
              </DefaultButton>
            </div>
          </Modal>
        )}
        {isModalOpen.deleteAlert && (
          <Modal
            isOpen={isModalOpen.deleteAlert}
            onClose={() => handleToggleModal("deleteAlert", 0)}
          >
            <div className={styles.buttonBox}>
              {t("sketchbook.check")}
              <DefaultButton
                onClick={() => deleteSketchbook.mutate(data?.data?.id)}
              >
                {t("sketchbook.delete")}
              </DefaultButton>
              <DefaultButton
                onClick={() => {
                  handleToggleModal("sketchbookInfo", 0);
                  handleToggleModal("deleteAlert", 0);
                }}
              >
                {t("sketchbook.cancel")}
              </DefaultButton>
            </div>
          </Modal>
        )}
        {isModalOpen.renameAlert && (
          <Modal
            isOpen={isModalOpen.renameAlert}
            onClose={() => handleToggleModal("renameAlert", 0)}
          >
            <div className={styles.buttonBox}>
              <input
                placeholder={t("sketchbook.rename")}
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  inputEnter(e)
                }
              />
              <DefaultButton onClick={() => handleUserNicknameChange(name)}>
                {t("sketchbook.rename")}
              </DefaultButton>
              <DefaultButton
                onClick={() => {
                  handleToggleModal("sketchbookInfo", 0);
                  handleToggleModal("renameAlert", 0);
                }}
              >
                {t("sketchbook.cancel")}
              </DefaultButton>
            </div>
          </Modal>
        )}
      </article>
    </>
  );
}

export default SketchbookPage;
