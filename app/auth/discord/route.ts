import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const origin = request.url.split('/auth/discord')[0];

  if (!code) {
    // Redirect to Discord OAuth
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', process.env['DISCORD_CLIENT_ID']!);
    discordAuthUrl.searchParams.set('redirect_uri', process.env['DISCORD_REDIRECT_URI']!);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify email');

    return NextResponse.redirect(discordAuthUrl.toString());
  }

  // Exchange code for token
  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env['DISCORD_CLIENT_ID']!,
        client_secret: process.env['DISCORD_CLIENT_SECRET']!,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env['DISCORD_REDIRECT_URI']!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/login?error=discord_auth_failed`);
    }

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!discordUser.email) {
      return NextResponse.redirect(`${origin}/login?error=discord_email_required`);
    }

    // Sign in or create user in Supabase
    const supabase = await createClient();

    // Check if user exists by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', discordUser.email)
      .single();

    if (existingProfile) {
      // User exists - send magic link to sign in
      await supabase.auth.signInWithOtp({
        email: discordUser.email,
        options: {
          emailRedirectTo: `${origin}/dashboard`,
        },
      });

      // Redirect to login with a message
      return NextResponse.redirect(
        `${origin}/login?message=Please check your email to complete Discord sign in`
      );
    }

    // New user - create account
    // Generate a random password since Discord handles authentication
    const randomPassword =
      Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';

    const { error: signUpError } = await supabase.auth.signUp({
      email: discordUser.email,
      password: randomPassword,
      options: {
        data: {
          full_name: discordUser.username || discordUser.global_name || 'Discord User',
          avatar_url: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          provider: 'discord',
          discord_id: discordUser.id,
        },
        emailRedirectTo: `${origin}/onboarding`,
      },
    });

    if (signUpError) {
      console.error('Discord signup error:', signUpError);
      return NextResponse.redirect(`${origin}/login?error=discord_signup_failed`);
    }

    // Redirect to onboarding for new users
    return NextResponse.redirect(`${origin}/onboarding`);
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(`${origin}/login?error=discord_auth_failed`);
  }
}
