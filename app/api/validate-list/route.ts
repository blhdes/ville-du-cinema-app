import { NextResponse } from 'next/server';

const CANDIDATE_USERS = [
    'karsten', 'lucy', 'gemko', 'demi', 'patrick',
    'kambole', 'megan', 'hollie', 'jake', 'silent',
    'mike', 'neil', 'louise', 'jordan', 'leah',
    'ryan', 'tyler', 'clay', 'kyle', 'mad',
    'eye', 'film', 'andrew', 'michael', 'bird',
    'nathan', 'josh', 'adam', 'sean', 'david',
    'trent', 'zach', 'wild', 'cinema', 'smuddy', 'movies',
    // Additional common names to test
    'nick', 'alex', 'sam', 'chris', 'emily',
    'sarah', 'tom', 'james', 'maria', 'daniel',
];

export async function GET() {
    const validUsers: string[] = [];
    const invalidUsers: string[] = [];

    for (const username of CANDIDATE_USERS) {
        try {
            const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
                method: 'HEAD',
            });

            if (response.ok) {
                validUsers.push(username);
            } else {
                invalidUsers.push(username);
            }
        } catch (error) {
            invalidUsers.push(username);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return NextResponse.json({
        total: CANDIDATE_USERS.length,
        valid: validUsers.length,
        invalid: invalidUsers.length,
        validUsers,
        invalidUsers
    });
}
