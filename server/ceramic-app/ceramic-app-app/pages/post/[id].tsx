import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Post from "../../components/post.component";
import { useCeramicContext } from "../../context";


const PostDetails: NextPage = () => {
  const router = useRouter()
  const { id } = router.query

  const clients = useCeramicContext() 
  const {ceramic, composeClient} = clients

  const [postDetails, setPostDetails ] = useState({})

  const getPost = async () => {
    const postDetails = await composeClient.executeQuery(`
      query {
        node(id:"$${id}"){
          ...on Posts{
            body
            id
            created
            author {
              basicProfile {
                username
                name
                id
              }
            }
            comments(last:30){
              edges {
                node {
                  id
                  author {
                    basicProfile {
                      username
                      name
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    `)
    console.log(postDetails.data)

    setPostDetails({
      author: {
        id: postDetails.data?.node.author.basicProfile.id,
        body: postDetails.data?.node.author.basicProfile.body,
        created: postDetails.data?.node.author.basicProfile.created
      },
      post: {
        id: postDetails.data?.node.id,
        body: postDetails.data?.node.body,
        created: postDetails.data?.node.created
      }
    })
  }

  useEffect(() => {
    getPost()
  }, [])

  return (
    <div className = "content">
      {postDetails.id !== undefined
      ?
      <>
        {postDetails.id}
      </>
        // <Post author = {postDetails.author} post = {postDetails.post} /> 
      :
      <>
        n/a
      </>
    }
    </div>
  )
}

export default PostDetails