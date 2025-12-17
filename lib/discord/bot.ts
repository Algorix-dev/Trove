import { Client, GatewayIntentBits, ChannelType } from 'discord.js'

let discordClient: Client | null = null

export async function getDiscordClient(): Promise<Client> {
  if (discordClient) {
    return discordClient
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  })

  await discordClient.login(process.env['DISCORD_BOT_TOKEN']!)
  return discordClient
}

export async function createDiscordChannel(
  channelName: string,
  categoryId?: string
): Promise<string | null> {
  try {
    const client = await getDiscordClient()
    const guild = await client.guilds.fetch(process.env['DISCORD_GUILD_ID']!)

    const channel = await guild.channels.create({
      name: channelName.toLowerCase().replace(/\s+/g, '-'),
      type: ChannelType.GuildText,
      parent: categoryId,
    })

    return channel.id
  } catch (error) {
    console.error('Error creating Discord channel:', error)
    return null
  }
}