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
        .setRequired(true)
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

      const moviesResults = await request(
        "https://api.themoviedb.org/3/search/movie?api_key=API_KEY&query=" +
          movie,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }
      );

      const data = await moviesResults.body.json();

      imageEndpoint += data.results[0].poster_path;
      const imageFile = await request(imageEndpoint);
      const imageBuffer = await imageFile.body.arrayBuffer();
      const image = Buffer.from(imageBuffer);

      const message = await interaction.editReply({
        files: [new AttachmentBuilder(image, imageEndpoint)],
        content,
        fetchReply: true,
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
      interaction.editReply("Erro ao avaliar o filme.");
    }
  },
};
