import type { NextPage } from 'next'
import Head from 'next/head'

import { Userform } from '../components/userform.component'

const ProfilePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <div className = "content">
        <div>
          <Userform />
        </div>
      </div>
    </>
  )
}

export default ProfilePage