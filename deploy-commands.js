const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;


const commands = [
  new SlashCommandBuilder()
    .setName("sala")
    .setDescription("Cria uma sala de voz temporária")
    .addStringOption(option =>
      option
        .setName("nome_da_sala")
        .setDescription("Nome da sala")
        .setRequired(true) // <<< obrigatória
        .setMaxLength(50)
    )
    .addIntegerOption(option =>
      option
        .setName("limite")
        .setDescription("Número máximo de pessoas")
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(10)
    )
].map(command => command.toJSON());


const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("⏳ A registar comando...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Comando registado com sucesso!");
  } catch (error) {
    console.error(error);
  }
})();
