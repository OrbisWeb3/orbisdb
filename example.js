// function generateMockEmbedding(dimension = 1536) {
//     const embedding = Array.from({ length: dimension }, () => Math.random());
//     return embedding;
//   }

// const mockEmbedding = generateMockEmbedding();
// const formattedEmbedding = `ARRAY[${mockEmbedding.join(", ")}]::vector`; // Format embedding as SQL-compatible array
// const query = `
//     SELECT *, embedding <=> ${formattedEmbedding} AS distance
//     FROM kjzl6hvfrbw6cb4dk7iapvsi17mp2wl8mbxuks4tkljb9fejnc8ivq6y6hgxgf3
//     ORDER BY distance
//     LIMIT 5;
// `;
// const stream = await db.select().raw(query).run();