import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export interface Review {
    id: string;
    username: string;
    title: string;
    link: string;
    pubDate: string;
    creator: string;
    review: string;
    rating: string;
    movieTitle: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const usernamesStr = searchParams.get('usernames');

    if (!usernamesStr) {
        return NextResponse.json({ error: 'Usernames parameter is required' }, { status: 400 });
    }

    const usernames = usernamesStr.split(',').map((u) => u.trim()).filter(Boolean);
    const allReviews: Review[] = [];

    try {
        const fetchPromises = usernames.map(async (username) => {
            try {
                const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
                    next: { revalidate: 3600 }, // Cache for 1 hour
                });

                if (!response.ok) {
                    console.error(`Failed to fetch RSS for ${username}: ${response.statusText}`);
                    return;
                }

                const xml = await response.text();
                const result = await parseStringPromise(xml);
                const items = result.rss.channel[0].item || [];

                items.forEach((item: {
                    description?: string[];
                    guid?: { _: string }[];
                    link: string[];
                    title: string[];
                    pubDate: string[];
                    'dc:creator'?: string[];
                }) => {
                    const link = item.link[0];
                    const title = item.title[0];

                    // Letterboxd RSS items for lists usually contain "/list/" in the URL
                    // Reviews/Diary entries contain "/film/" or are just direct links
                    if (link.includes('/list/')) {
                        return;
                    }

                    const description = item.description ? item.description[0] : '';

                    // Clean HTML in description
                    const cleanReview = description.replace(/<p><img src="[^"]+"\/><\/p>/, '').trim();

                    allReviews.push({
                        id: item.guid?.[0]?.['_'] || link,
                        username,
                        title: title,
                        link: link,
                        pubDate: item.pubDate[0],
                        creator: item['dc:creator'] ? item['dc:creator'][0] : username,
                        review: cleanReview,
                        rating: extractRating(title),
                        movieTitle: title.split(',')[0].trim(),
                    });
                });
            } catch (err) {
                console.error(`Error parsing RSS for ${username}:`, err);
            }
        });

        await Promise.all(fetchPromises);

        // Sort by pubDate descending
        allReviews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

        // Limit to 50
        const limitedReviews = allReviews.slice(0, 50);

        return NextResponse.json(limitedReviews);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function extractRating(title: string): string {
    const ratingMatch = title.match(/, (★|½)+/);
    return ratingMatch ? ratingMatch[0].replace(', ', '') : '';
}
