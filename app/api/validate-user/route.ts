import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
            method: 'HEAD', // Only check headers, don't download content
        });

        if (!response.ok) {
            return NextResponse.json({
                exists: false,
                username,
                error: response.status === 404 ? 'User not found' : 'Failed to validate user'
            }, { status: 200 });
        }

        return NextResponse.json({ exists: true, username }, { status: 200 });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json({
            exists: false,
            username,
            error: 'Failed to validate user'
        }, { status: 200 });
    }
}
