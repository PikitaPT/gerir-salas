require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  ChannelType, 
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

// ================= CONFIGURAÇÃO =================

const TOKEN = process.env.DISCORD_TOKEN;
const CANAL_TEXTO_SALA_ID = process.env.CANAL_TEXTO_ID;


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= BOT ONLINE =================
client.once("ready", () => {
  console.log(`✅ Bot ligado como ${client.user.tag}`);
});

// ================= SLASH COMMAND =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sala") {
    
    // 🔒 restringir a um canal de texto específico
    if (CANAL_TEXTO_SALA_ID && interaction.channelId !== CANAL_TEXTO_SALA_ID) {
      return interaction.reply({
        content: "❌ Este comando só pode ser usado neste canal.",
        ephemeral: true
      });
    }

    const member = interaction.member;

    // verificar se o utilizador está numa sala de voz
    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ Precisas de estar numa sala de voz para criar outra.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    let nome = interaction.options.getString("nome_da_sala");
    let limite = interaction.options.getInteger("limite");

    // limitar o máximo a 10 pessoas
    limite = Math.min(limite, 10);

    const guild = interaction.guild;
    const parentChannel = member.voice.channel.parent; // mantém na mesma categoria

    try {
      // criar a sala de voz
      const sala = await guild.channels.create({
        name: nome,
        type: ChannelType.GuildVoice,
        userLimit: limite,
        parent: parentChannel,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
          }
        ]
      });

      // mover o utilizador para a nova sala
      await member.voice.setChannel(sala);

      // apaga a mensagem do bot
      await interaction.deleteReply().catch(() => {});

      // monitorar a sala para apagar quando estiver vazia
      monitorarSala(sala);

    } catch (err) {
      console.error("ERRO AO CRIAR SALA:", err);
      await interaction.editReply(`❌ Ocorreu um erro ao criar a sala:\n\`${err.message}\``).catch(() => {});
    }
  }
});

// ================= AUTO-DELETE =================
function monitorarSala(canal) {
  const interval = setInterval(async () => {
    const canalAtual = canal.guild.channels.cache.get(canal.id);

    if (!canalAtual || canalAtual.members.size === 0) {
      clearInterval(interval);
      if (canalAtual) {
        await canalAtual.delete().catch(() => {});
      }
    }
  }, 5000); // verifica a cada 5 segundos
}

// ================= LOGIN =================
client.login(TOKEN);

// ================= COMANDO PARA REGISTRAR O /SALA =================
client.on("ready", async () => {
  const guild = client.guilds.cache.first(); // substitui por guild específica se quiser
  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("sala")
      .setDescription("Cria uma sala de voz temporária")
      .addStringOption(option => 
        option.setName("nome_da_sala")
          .setDescription("Nome da sala de voz")
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName("limite")
          .setDescription("Número máximo de pessoas (até 10)")
          .setRequired(true))
      .toJSON()
  );
});


client.on('messageCreate', async (message) => {
    // Ignora bots
    if (message.author.bot) return;

    // Só aplica no canal específico
    if (message.channel.id !== CANAL_TEXTO_SALA_ID) return;

    // Se a mensagem começar por /sala, deixa passar
    if (message.content.trim().startsWith('/sala')) return;

    // Caso contrário, tenta apagar
    try {
        await message.delete();
    } catch (err) {
        // Não quebra o bot se não tiver permissão
        console.log(
            `Não foi possível deletar mensagem de ${message.author.tag} (${err.code})`
        );
    }
});
