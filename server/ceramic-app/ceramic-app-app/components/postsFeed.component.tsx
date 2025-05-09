import React, { useEffect } from "react";

// import { useCeramicContext } from "../context";

import styles from "../styles/postsFeed.module.scss";
import Post from "./post.component";

export const PostsFeed = ({ posts, refreshPosts }) => {
  useEffect(() => {
    refreshPosts();
  }, []);

  return (
    <div className={styles.postContainer}>
      {posts.map((post) => (
        <Post author={post.author} post={post.post} key={post.post.id} tag={post.post.tag} />
      ))}
    </div>
  );
};
