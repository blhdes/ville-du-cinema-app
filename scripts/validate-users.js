// Script to validate all discovery users against Letterboxd
const CANDIDATE_USERS = [
    'karsten',
    'lucy',
    'davidehrlich',
    'gemko',
    'silent_j',
    'mrcook',
    'hollie',
    'mikedangelo',
    'tythecriticalguy',
    'demiadejuyigbe',
    'neilbahadur',
    'zillastar',
    'moviessilently',
    'stinkylouise',
    'kambole',
    'patrick',
    'wildrover',
    'joshuaderick',
    'horrormoviebbq',
    'madmanmaddux',
    'eyefeast',
    'clayjbird',
    'kylekalgren',
    'jordanhoffman',
    'leahbonser',
    'wotcher',
    'ryanlambie',
    'smuddy',
    'filmbrowse',
    'andrewjwest',
    'michaelkenneally',
    'birdman',
    'nathaxnne',
    'tylercrowley',
    'tnkr',
    'sargon',
];

async function validateUser(username) {
    try {
        const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
            method: 'HEAD',
        });
        return response.ok;
    } catch (error) {
        console.error(`Error checking ${username}:`, error.message);
        return false;
    }
}

async function validateAllUsers() {
    console.log('Starting validation of', CANDIDATE_USERS.length, 'users...\n');

    const results = [];
    const validUsers = [];
    const invalidUsers = [];

    for (const username of CANDIDATE_USERS) {
        process.stdout.write(`Checking ${username}... `);
        const isValid = await validateUser(username);

        if (isValid) {
            console.log('✓ VALID');
            validUsers.push(username);
        } else {
            console.log('✗ INVALID');
            invalidUsers.push(username);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n========================================');
    console.log('VALIDATION COMPLETE');
    console.log('========================================');
    console.log(`Valid users: ${validUsers.length}`);
    console.log(`Invalid users: ${invalidUsers.length}`);

    if (invalidUsers.length > 0) {
        console.log('\nInvalid users:');
        invalidUsers.forEach(u => console.log(`  - ${u}`));
    }

    console.log('\n========================================');
    console.log('VALID USERS FOR discoveryUsers.ts:');
    console.log('========================================');
    console.log(JSON.stringify(validUsers, null, 4));
}

validateAllUsers();
