import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail'],
  },
});

// Google News RSS feeds (FREE, no API key, works in production)
const RSS_FEEDS = {
  books: 'https://news.google.com/rss/search?q=books&hl=en&gl=US&ceid=US:en',
  manga: 'https://news.google.com/rss/search?q=manga&hl=en&gl=US&ceid=US:en',
  anime: 'https://news.google.com/rss/search?q=anime&hl=en&gl=US&ceid=US:en',
  bookReleases: 'https://news.google.com/rss/search?q=book+releases&hl=en&gl=US&ceid=US:en',
  authors: 'https://news.google.com/rss/search?q=author+news&hl=en&gl=US&ceid=US:en',
};

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('favorite_genres, news_preferences')
      .eq('user_id', user.id)
      .single();

    const userGenres = preferences?.favorite_genres || [];

    // Determine which feeds to fetch based on preferences
    const feedsToFetch: string[] = [];

    if (userGenres.length === 0) {
      // No preferences, fetch all
      feedsToFetch.push(...Object.values(RSS_FEEDS));
    } else {
      // Fetch based on preferences
      if (userGenres.some((g: string) => ['Manga', 'Comics'].includes(g))) {
        feedsToFetch.push(RSS_FEEDS.manga);
      }
      if (userGenres.some((g: string) => ['Anime'].includes(g))) {
        feedsToFetch.push(RSS_FEEDS.anime);
      }
      if (
        userGenres.some((g: string) =>
          ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy'].includes(g)
        )
      ) {
        feedsToFetch.push(RSS_FEEDS.books, RSS_FEEDS.bookReleases);
      }
      if (feedsToFetch.length === 0) {
        // Default to books if no match
        feedsToFetch.push(RSS_FEEDS.books);
      }
    }

    // Fetch and parse RSS feeds
    const allNewsItems: Array<{
      title: string;
      description: string;
      url: string;
      source: string;
      category: string;
      published_at: string;
      image_url: string | null;
      tags: string[];
    }> = [];

    for (const feedUrl of feedsToFetch) {
      try {
        const feed = await parser.parseURL(feedUrl);

        if (feed.items) {
          feed.items.forEach((item) => {
            // Extract image from media or content
            let imageUrl = null;
            if (item['media:content']) {
              imageUrl = item['media:content'].$.url;
            } else if (item['media:thumbnail']) {
              imageUrl = item['media:thumbnail'].$.url;
            }

            // Determine category
            let category = 'general';
            if (feedUrl.includes('manga')) category = 'manga';
            else if (feedUrl.includes('anime')) category = 'anime';
            else if (feedUrl.includes('author')) category = 'author';
            else if (feedUrl.includes('book')) category = 'book';

            allNewsItems.push({
              title: item.title || 'Untitled',
              description: item.contentSnippet || item.content || '',
              url: item.link || '',
              source: item.creator || 'Google News',
              category: category,
              published_at: item.pubDate
                ? new Date(item.pubDate).toISOString()
                : new Date().toISOString(),
              image_url: imageUrl,
              tags: extractTags(item.title || '', item.contentSnippet || ''),
            });
          });
        }
      } catch (error) {
        // Continue with other feeds
      }
    }

    // Remove duplicates (by title)
    const uniqueNews = Array.from(
      new Map(allNewsItems.map((item) => [item.title || '', item])).values()
    );

    // Sort by date (newest first)
    uniqueNews.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    // Limit to 20 items
    const limitedNews = uniqueNews.slice(0, 20);

    // Optionally save to database for caching
    if (limitedNews.length > 0) {
      // Upsert news items (avoid duplicates)
      for (const newsItem of limitedNews) {
        await supabase.from('book_news').upsert(
          {
            title: newsItem.title,
            description: newsItem.description,
            url: newsItem.url,
            source: newsItem.source,
            category: newsItem.category,
            published_at: newsItem.published_at,
            image_url: newsItem.image_url,
            tags: newsItem.tags,
          },
          {
            onConflict: 'title',
          }
        );
      }
    }

    return NextResponse.json({
      news: limitedNews,
      preferences: userGenres,
      source: 'google-news-rss',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to extract tags from content
function extractTags(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const commonTags = ['book', 'manga', 'anime', 'author', 'release', 'novel', 'series', 'comic'];
  return commonTags.filter((tag) => text.includes(tag));
}
