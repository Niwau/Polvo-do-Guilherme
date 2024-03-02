const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const { request, Agent, setGlobalDispatcher } = require("undici");

setGlobalDispatcher(new Agent({ connect: { timeout: 60_000 } }));

const createMovieEmbed = ({
  author,
  movie,
  movieDescription,
  score,
  comment,
  avatar,
  moviePoster,
}) => {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: `Analisado por ${author}`,
    })
    .setThumbnail(avatar)
    .setTitle(movie.toUpperCase())
    .setDescription(movieDescription)
    .addFields(
      {
        name: "NOTA",
        value: score.toString() + '/10',
        inline: false,
      },
      {
        name: "COMENTÁRIO",
        value: comment,
        inline: true,
      }
    )
    .setImage(moviePoster)
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
        .setMinValue(0)
        .setMaxValue(10)
    )
    .addStringOption((option) =>
      option
        .setName("comentario")
        .setDescription("Comentário sobre a obra a ser avaliada.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const movie = interaction.options.getString("nome");
    const score = interaction.options.getNumber("nota");
    const comment = interaction.options.getString("comentario");

    try {
      await interaction.deferReply();

      let imageEndpoint = "https://image.tmdb.org/t/p/original";

      const moviesResults = await request(
        "https://api.themoviedb.org/3/search/movie?api_key=API_KEY&language=pt-br&query=" +
          movie,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }
      );

      const data = await moviesResults.body.json();

      if (data.results.length === 0) {
        return interaction.editReply("O filme não foi encontrado.");
      }

      imageEndpoint += data.results[0].backdrop_path;

      const embed = createMovieEmbed({
        author: interaction.member.displayName,
        movie,
        score,
        comment: comment ?? "Nenhum comentário.",
        movieDescription: data.results[0].overview,
        avatar: interaction.user.displayAvatarURL({ dynamic: true }),
        moviePoster: imageEndpoint,
      });

      const message = await interaction.editReply({
        fetchReply: true,
        embeds: [embed],
      });

      if (score < 5) {
        await message.react("🤢");
      } else if (score < 8) {
        await message.react("🤔");
      } else {
        await message.react("🤩");
      }
    } catch (error) {
      console.error(error);
      interaction.editReply("❌ Ocorreu um erro ao avaliar o filme.");
    }
  },
};
