import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../styles/createPostForm.module.scss";

import { useCeramicContext } from "../context";

interface CreatePostFormProps {
  refreshPosts: () => Promise<void>;
}

export const CreatePostForm = ({ refreshPosts }) => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;

  const [profile, setProfile] = useState(null);
  const [newPost, setNewPost] = useState("");
  const [tag, setTag] = useState("");

  const createPost = async () => {
    if (ceramic.did !== undefined && profile && profile.name) {
      const post = await composeClient.executeQuery(`
          mutation {
            createPosts(input: {
              content: {
                body: "${newPost}"
                tag: "${tag || "general"}"
                created: "${new Date().toISOString()}"
                profileId: "${profile.id}"
              }
            })
            {
              document {
                body
              }
            }
          }
        `);
      // getPosts();
      setNewPost("");
      setTag("");
      alert("Created post.");
    } else {
      alert("Failed to fetch profile for authenticated user. Please register a profile.");
    }
    // After creating the post, refresh the posts
    await refreshPosts();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await composeClient.executeQuery(`
        query {
          viewer {
            basicProfile {
              id
              name
            }
          }
        }
      `);
      setProfile(profile.data?.viewer?.basicProfile);
    };

    fetchProfile();
  }, []);

  return (
    <div className={styles.share}>
      <textarea
        value={newPost}
        maxLength={200}
        placeholder='What are you thinking about?'
        className={styles.postInput}
        onChange={(e) => {
          setNewPost(e.target.value);
        }}
      />
      <textarea
        value={tag}
        maxLength={50}
        placeholder='Enter a Category Tag'
        className={styles.postInput}
        onChange={(e) => {
          setTag(e.target.value);
        }}
      />
      <button
        onClick={() => {
          createPost();
        }}
      >
        Share
      </button>
    </div>
  );
};
