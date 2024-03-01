const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const { request } = require('undici');

const createMovieEmbed = ({
  author,
  movie,
  movieDescription,
  score,
  comment,
}) => {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Analisado por ${author}`,
    })
    .setTitle(movie.toUpperCase())
    .setDescription(movieDescription)
    .addFields(
      {
        name: "NOTA",
        value: score,
        inline: false,
      },
      {
        name: "COMENTÁRIO",
        value: comment,
        inline: true,
      }
    )
    .setImage("https://cubedhuang.com/images/alex-knight-unsplash.webp")
    .setColor("#a907ab");
  return embed;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avaliar")
    .setDescription(
      "🎥 Faz a avaliação de um filme, série, jogo, livro ou qualquer coisa que você quiser!"
    )
    .addStringOption((option) =>
      option
        .setName("nome")
        .setDescription("Nome da obra a ser avaliada.")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("nota")
        .setDescription("Nota da obra a ser avaliada.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("comentario")
        .setDescription("Comentário sobre a obra a ser avaliada.")
        .setRequired(false)
    ),
  async execute(interaction) {
    const movie = interaction.options.getString("nome");
    const score = interaction.options.getNumber("nota");
    const comment = interaction.options.getString("comentario");

    const content = `Avaliado por: **${
      interaction.member.displayName
    }**\nObra: **${movie}**\nNota: **${score}/10**\nComentário: **${
      comment ?? "Nenhum comentário."
    }**`;

    try {
      await interaction.deferReply();

      let imageEndpoint = "https://image.tmdb.org/t/p/w500";

      const response = await fetch(
        "https://api.themoviedb.org/3/search/movie?api_key=API_KEY&query=" +
          movie,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }
      );

      const data = await response.json();

      imageEndpoint += data.results[0].poster_path;

      const message = await interaction.editReply({
        files: [new AttachmentBuilder(imageEndpoint, "img.png")],
        content,
        fetchReply: true,
      });

      if (score < 5) {
        message.react("🤢");
      } else if (score < 8) {
        message.react("🤔");
      } else {
        message.react("🤩");
      }
    } catch (error) {
      console.error(error);
      interaction.editReply("Erro ao avaliar o filme.");
    }
  },
};
