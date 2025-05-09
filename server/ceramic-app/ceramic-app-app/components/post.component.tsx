import Link from "next/link";
import styles from "../styles/postsFeed.module.scss";

import { PostProps } from "../types";

const Post = ({ author, post }: PostProps) => {
  console.log(post);
  return (
    <div className={styles.post} key={post.id}>
      <div className={styles.postBody}>{post.body}</div>
      <div className={styles.postMeta}>
        <div>
          by {author.emoji}&nbsp;
          <Link href={`/user/${author.id}`}>
            <a>
              {author.name}&nbsp;&nbsp;(@{author.username})
            </a>
          </Link>
        </div>
        {post.tag && <div>Category: {post.tag}</div>}
      </div>
    </div>
  );
};

export default Post;
