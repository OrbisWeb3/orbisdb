import Post from "../components/post.component";
import styles from "../styles/postsFeed.module.scss";

import type { NextPage } from "next";

import { useEffect, useState } from "react";
import { useCeramicContext } from "../context";
import { PostProps } from "../types";

const ExplorePage: NextPage = () => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;
  let alerted = false;

  const [posts, setPosts] = useState<PostProps[] | []>([]);

  const explorePosts = async () => {
    const res = await composeClient.executeQuery(`
      query {
        postsIndex (last:300) {
          edges {
            node {
              id
              body
              created
              profile {
                id
                name
                username 
                emoji
              }
            }
          }
        }
      }
    `);
    const posts: PostProps[] = [];

    res.data.postsIndex.edges.map((post) => {
      if (post.node) {
        posts.push({
          author: {
            id: post.node.profile.id,
            name: post.node.profile.name,
            username: post.node.profile.username,
            emoji: post.node.profile.emoji,
          },
          post: {
            body: post.node.body,
            created: post.node.created,
            id: post.node.id,
          },
        });
      }
    });
    posts.sort((a, b) => new Date(b.post.created).getTime() - new Date(a.post.created).getTime());
    if (posts.length == 0) {
      if (!alerted) {
        alert(
          "There's nothing here! Try posting with a registered profile or see the README to upgrade to claynet to see other developer's posts."
        );
        alerted = true;
      }
    }
    setPosts(posts);
  };

  useEffect(() => {
    explorePosts();
  }, []);

  return (
    <div className='content'>
      <div className={styles.postContainer}>
        <h1>Explore</h1>
        {posts?.map((post) => (
          <Post author={post.author} post={post.post} key={post.post.id} />
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;
