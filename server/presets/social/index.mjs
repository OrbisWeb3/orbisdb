export async function initSocialPreset(db) {
    // Create required tables
    await db.indexModel("kjzl6hvfrbw6c88wvnnb8x62rwvt5iphtvgmg88s4qis09nvchbij21c70th28a");  // Index social post
    await db.indexModel("kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a");  // Index social profile
    await db.indexModel("kjzl6hvfrbw6catjwpn53stszvbv04ez7phlfheparps47kbx8q7t11z6l06lwl");  // Index social reactions
    await db.indexModel("kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt");  // Index social follows
    await db.indexModel("kjzl6hvfrbw6c7i887rh9a3kieykdfai4k5lc95wv9nbgzphijmrcqm1885at63");  // Index social encrypted emails
    await db.indexModel("kjzl6hvfrbw6c8ynorxt2tp766711479zupiaq6ai80wgsgbr256hbap4mpspt3");  // Index social conversations
    await db.indexModel("kjzl6hvfrbw6cav5vj5fmqxxt95gjlkuxroafdl4elues1il176flbixrcaq9bv");  // Index social DMs    

    // Create required views
    await db.query(v_posts);
    await db.query(v_followers);
}

/** PRESET VIEWS */

/** Posts view */
const v_posts = `CREATE OR REPLACE VIEW v_posts AS
SELECT
    posts.stream_id,
    posts.controller,
    posts.body,
    posts.data,
    posts.tags,
    posts.media,
    posts.title,
    posts.master,
    posts.context,
    posts.mentions,
    posts.reply_to,
    posts.sourceurl,
    posts.encryptedbody,
    posts._metadata_context,
    posts.plugins_data,
    posts.indexed_at,
    jsonb_build_object(
        'did', posts.controller,
        'stream_id', profile.stream_id,
        'username', profile.username,
        'description', profile.description,
        'pfp', profile.pfp,
        'plugins_data', profile.plugins_data
    ) AS profile
FROM
    kjzl6hvfrbw6c88wvnnb8x62rwvt5iphtvgmg88s4qis09nvchbij21c70th28a AS posts
LEFT JOIN
    kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a AS profile
ON
    profile.controller = posts.controller
ORDER BY
    posts.indexed_at DESC NULLS LAST;`;

/** Followers view */
const v_followers = `CREATE OR REPLACE VIEW v_followers AS
    SELECT kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.stream_id,
        kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.did AS did_followed,
        kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.controller AS did_following,
        json_build_object(
            'did', kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.did, 
            'username', orbis_profiles_followed.username, 
            'description', orbis_profiles_followed.description, 
            'pfp', orbis_profiles_followed.pfp, 
            'plugins_data', orbis_profiles_followed.plugins_data
        ) AS did_followed_details,
        json_build_object(
            'did', kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.controller, 
            'username', orbis_profiles_following.username, 
            'description', orbis_profiles_following.description, 
            'pfp', orbis_profiles_following.pfp, 
            'plugins_data', orbis_profiles_following.plugins_data
        ) AS did_following_details,
        kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.active
    FROM ((kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt
    LEFT JOIN kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a orbis_profiles_following ON ((orbis_profiles_following.controller = kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.controller)))
    LEFT JOIN kjzl6hvfrbw6c9ajvxfoyxcpi8zbiilf5c62zyxk1tzt31rsei9zeq1sqddy09a orbis_profiles_followed ON ((orbis_profiles_followed.controller = kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.did)))
    ORDER BY kjzl6hvfrbw6c7m2zwttqjjrh9uibh3im0qmxab3apf7wq37lrjid26iyu137jt.indexed_at DESC;`;