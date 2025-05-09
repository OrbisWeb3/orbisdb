import { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";

import { useCeramicContext } from "../context";

import { CreatePostForm } from "../components/createPostForm.component";
import { PostsFeed } from "../components/postsFeed.component";

import Head from "next/head";

import { PostProps } from "../types";
import styles from "../styles/Home.module.scss";
import AuthPrompt from "./did-select-popup";
import React from "react";
import { authenticateCeramic } from "../utils";

type Profile = {
  id?: any;
  name?: string;
  username?: string;
  description?: string;
  gender?: string;
  emoji?: string;
};

const Home: NextPage = () => {
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;
  const [profile, setProfile] = useState<Profile | undefined>();

  const [isLoading, setIsLoading] = useState(true);

  const [posts, setPosts] = useState<PostProps[] | []>([]);

  const getProfile = async () => {
    console.log("ceramic.did: ", ceramic.did);
    if (ceramic.did !== undefined) {
      const profile = await composeClient.executeQuery(`
        query {
          viewer {
            id
            basicProfile {
              id
              name
              username
            }
          }
        }
      `);
      localStorage.setItem("viewer", profile?.data?.viewer?.id);

      console.log("Profile in getProfile: ", profile?.data?.viewer?.basicProfile);
      setProfile(profile?.data?.viewer?.basicProfile);
      setIsLoading(false);
    } else {
      setProfile(undefined);
      setIsLoading(false);
    }
  };

  const getPosts = async () => {
    console.log("basicProfile: ", profile?.data?.viewer?.basicProfile);

    const following = await composeClient.executeQuery(`
      query {
        node(id: "${profile?.data?.viewer?.id}") {
          ...on CeramicAccount {
            followingList(last:300) {
              edges {
                node {
                  profile {
                    id
                    username
                    name
                    emoji
                    posts(last:30) {
                      edges {
                        node {
                          id
                          body
                          created
                          tag
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);
    console.log("Following: ", following?.data?.node?.followingList?.edges);

    const explore = await composeClient.executeQuery(`
      query {
        postsIndex(last:300) {
          edges {
            node {
              id
              body
              tag
              created
              profile{
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
    console.log("Explore: ", explore?.data?.postsIndex?.edges);

    // TODO: Sort based off of "created date"
    const posts: PostProps[] = [];

    if (following?.data?.node !== null) {
      console.log("Following: ", following);
      following.data?.node?.followingList.edges.map((profile) => {
        if (profile.node !== null) {
          profile.node.profile.posts.edges.map((post) => {
            if (post.node !== null) {
              posts.push({
                author: {
                  id: profile.node.profile.id,
                  name: profile.node.profile.name,
                  username: profile.node.profile.username,
                  emoji: profile.node.profile.emoji,
                },
                post: {
                  id: post.node.id,
                  body: post.node.body,
                  tag: post.node.tag,
                  created: post.node.created,
                },
              });
            }
          });
        }
      });
      console.log("Explore: ", explore);
    } else {
      explore.data?.postsIndex?.edges.map((post) => {
        posts.push({
          author: {
            id: post.node.profile.id,
            name: post.node.profile.name,
            username: post.node.profile.username,
            emoji: post.node.profile.emoji,
          },
          post: {
            id: post.node.id,
            body: post.node.body,
            tag: post.node.tag,
            created: post.node.created,
          },
        });
      });
    }
    posts.sort((a, b) => new Date(b.created) - new Date(a.created));
    console.log("Posts: ", posts);
    // setPosts(posts?.reverse()); // reverse to get most recent msgs
    setIsLoading(false);
    return posts.reverse();
  };

  const refreshPosts = async () => {
    // Fetch new posts and update the state
    const newPosts = await getPosts();
    setPosts(newPosts);
  };

  useEffect(() => {
    getProfile();
    refreshPosts();
  }, []);

  return (
    <>
      <Head>
        <title>Ceramic Social</title>
        <link rel='icon' href='/ceramic-favicon.svg' />
      </Head>
      <div className='content'>
        {profile ? (
          <>
            <CreatePostForm refreshPosts={refreshPosts} />
            <PostsFeed posts={posts} refreshPosts={refreshPosts} />
          </>
        ) : (
          <>
            <h2 className={styles.accentColor}>
              Please{" "}
              <Link href={`/profile`}>
                <a style={{ color: "white" }}>create a profile</a>
              </Link>{" "}
              before posting.
            </h2>
          </>
        )}
      </div>
    </>
  );
};

export default Home;
