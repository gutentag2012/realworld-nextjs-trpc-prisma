// noinspection NpmUsedModulesInstalled

const Prisma = require('.prisma/client')
const bcrypt = require('bcrypt')

const prisma = new Prisma.PrismaClient()
async function main() {
  const data = await fetch('https://api.realworld.io/api/articles?limit=200').then(res =>
    res.json(),
  )

  const password = 'Test1234'
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { email: 'joshua@gawenda.de' },
    update: {},
    create: {
      email: 'joshua@gawenda.de',
      username: 'gutentag2012',
      passwordHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'author@of.all.com' },
    update: {},
    create: {
      email: 'author@of.all.com',
      username: 'AuthorOfAll',
      passwordHash,
    },
  })

  for (const article of data.articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        tagList: {
          connectOrCreate: article.tagList.map(tag => ({
            where: { value: tag },
            create: { value: tag },
          })),
        },
        author: {
          connectOrCreate: {
            where: { username: article.author.username },
            create: {
              username: article.author.username,
              email: article.author.username.replace(/\s/g, '') + '@author.com',
              passwordHash,
              image: article.author.image,
              bio: article.author.bio,
            },
          },
        },
      },
    })
  }
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
