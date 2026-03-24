import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Specific handling for PDFs
    if (url.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({
        title: url.split('/').pop() || 'PDF Document',
        description: 'PDF Document',
        thumbnail_url: '', 
        content: `PDF Document: ${url}`,
        url,
        type: 'pdf'
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    
    // Specific handling for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      
      if (videoId) {
        const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/i) || html.match(/<title>(.*?)<\/title>/i);
        return NextResponse.json({
          title: titleMatch ? titleMatch[1] : 'YouTube Video',
          description: 'YouTube Video',
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          content: `YouTube Video: ${url}`,
          url,
          type: 'video'
        });
      }
    }

    // Specific handling for Twitter/X
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      return NextResponse.json({
        title: titleMatch ? titleMatch[1] : 'Tweet',
        description: 'Tweet from X/Twitter',
        thumbnail_url: '', // Twitter is hard to scrape without API, but we can try og:image
        content: `Tweet: ${url}`,
        url,
        type: 'tweet'
      });
    }

    // Basic meta tag extraction
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';

    const descriptionMatch = html.match(/<meta name="description" content="(.*?)"/i) || 
                             html.match(/<meta property="og:description" content="(.*?)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/i) ||
                       html.match(/<meta name="twitter:image" content="(.*?)"/i);
    const thumbnail_url = imageMatch ? imageMatch[1] : '';

    // Extract some body text for Gemini
    const bodyText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
                         .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim()
                         .substring(0, 5000); // Limit for Gemini

    return NextResponse.json({
      title,
      description,
      thumbnail_url,
      content: bodyText,
      url
    });

  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
