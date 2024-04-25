import { Link } from "react-router-dom";
import CommonShareIcon from "../share/commonShareIcon";
import styles from "./SketchbookListItem.module.scss";

interface Props {
  url: string;
  item: {
    id: string;
    isPublic: boolean;
    shareLink: string;
    name: string;
    holder: {
      nickname: string;
      nicknameTag: number;
    };
    uuid: string;
    tag: number;
    isWritePossible: boolean;
  };
}
function SketchbookListItem({ item, url }: Props) {
  return (
    <li className={styles.itemContainer}>
      <CommonShareIcon link={item.shareLink} />
      <Link to={url} className={styles.sketchbookListItem}>
        {item.name}
      </Link>
    </li>
  );
}

export default SketchbookListItem;
