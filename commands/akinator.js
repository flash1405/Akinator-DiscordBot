const { SlashCommandBuilder } = require("discord.js");
const { runAkinator } = require("../index");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("akinator")
    .setDescription("Starts a game of Akinator"),
  async execute(interaction) {
    interaction.reply("Starting a game of Akinator...");
  },
};
