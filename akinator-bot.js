const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
  const { Aki } = require("aki-api");
  const { list, verify } = require("./functions.js");
  const modes = ["person", "object", "animal"];

  //   if (!message.channel.permissionsFor(client.user).has(1 << 14)) {
  //     return message.channel.send("Missing Permissions: [EMBED_LINKS]");
  //   }
  if (!args[0]) {
    return message.channel.send(
      `Please provide a mode. Modes: ${list(modes, "or")}`
    );
  }

  let mode = args[0].toLowerCase();
  let region;
  if (mode === "person".toLocaleLowerCase()) {
    region = "en";
  }
  if (mode === "object".toLocaleLowerCase()) {
    region = "en_objects";
  }
  if (mode === "animal".toLocaleLowerCase()) {
    region = "en_animals";
  }
  if (!modes.includes(mode)) {
    return message.channel.send(`Invalid mode. Modes: ${list(modes, "or")}`);
  }
  message.channel
    .send("Please wait...")
    .then((msg) => msg.delete({ timeout: 4000 }));

  try {
    const aki = new Aki({ region });
    let ans = null;
    let win = false;
    let timesGuessed = 0;
    let guessResetNum = 0;
    let wentBack = false;
    let forceGuess = false;
    const guessBlacklist = [];
    while (timesGuessed < 3) {
      if (guessResetNum > 0) guessResetNum--;
      if (ans === null) {
        await aki.start();
      } else if (wentBack) {
        await aki.back();
        wentBack = false;
      } else {
        try {
          await aki.step(ans);
        } catch (err) {
          console.log(err);
          await aki.step(ans);
        }
      }
      if (!(await aki.win().guesses) || aki.currentStep >= 79) {
        forceGuess = true;
      }
      const answers = aki.answers.map((x) => x.toLowerCase());
      answers.push("end");
      if (aki.currentStep > 0) {
        answers.push("back");
      }
      const embed = new Discord.EmbedBuilder()
        .setTitle(
          `Question Number ${aki.currentStep + 1}`
          //   client.user.avatarURL()
        )
        .setDescription(
          `${await aki.question}\n Available Answers:
          ${aki.answers.join(" | ")}${
            aki.currentStep > 0 ? " | Back" : ""
          } | End`
        );
      await message.channel.send({ embeds: [embed] });
      const filter = (res) =>
        res.author.id === message.author.id &&
        answers.includes(res.content.toLowerCase());
      const messages = await message.channel.awaitMessages(filter, {
        max: 1,
        time: 30000,
      });
      console.log(messages);
      if (!messages.size) {
        await message.channel.send("Time's up!");
        win = true;
        break;
      }
      const choice = messages.first().content.toLowerCase();
      if (choice.toLowerCase() === "end".toLocaleLowerCase()) {
        forceGuess = true;
      } else if (choice.toLowerCase() === "back".toLocaleLowerCase()) {
        wentBack = true;
        await aki.back();
        continue;
      } else {
        ans = answers.indexOf(choice);
      }
      if ((aki.progress >= 90 && !guessResetNum) || forceGuess) {
        timesGuessed++;
        guessResetNum += 10;
        await aki.win();
        const guess = await aki
          .win()
          .guesses.filter((x) => !guessBlacklist.includes(x.id))[0];
        if (!guess) {
          await message.channel.send("I'm cannot think of anyone! You win!");
          win = true;
          break;
        }
        guessBlacklist.push(guess.id);
        const embed = new Discord.EmbedBuilder()
          .setTitle(`I am ${Math.round(guess.proba * 100)}% sure it is...`)
          .setDescription(
            `${guess.name}${
              guess.description ? `\nProfession - ${guess.description}` : ""
            }\nRanking - ${guess.ranking}\nType yes/no to confirm or deny!`
          )
          .setImage(guess.absolute_picture_path || null);
        await message.channel.send({ embeds: [embed] });
        const verification = await verify(message.channel, message.author);
        if (verification === 0) {
          win = "time";
          break;
        } else if (verification) {
          win = false;
        } else {
          const exmessage =
            timesGuessed >= 3 || forceGuess
              ? "I give up!"
              : "I can keep going!";
          const embed = new Discord.EmbedBuilder().setDescription(
            `Is that so? ${exmessage}`
          );
          await message.channel.send({ embeds: [embed] });
          if (timesGuessed >= 3 || forceGuess) {
            win = true;
            break;
          }
        }
      }
    }
    if (win === "time") {
      return message.channel.send("I guess your silence means I win!");
    }
    if (win) {
      const embed = new Discord.EmbedBuilder()
        .setDescription(["You have defeated me!"])
        .setColor("RANDOM");
      return message.channel.send(embed);
    } else {
      return message.channel.send("Guessed it right once gain!");
    }
  } catch (err) {
    console.log(err);
    return message.channel.send(
      "There was an error! Please try again later or report this."
    );
  }
};

module.exports.help = {
  name: "akinator",
  description: "Starts a game of Akinator",
  category: "Fun",
};
