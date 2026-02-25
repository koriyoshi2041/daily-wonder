import { defineCollection, z } from 'astro:content'

const sketches = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    day: z.number(),
    tags: z.array(z.string()),
    tools: z.array(z.string()),
    thumbnail: z.string(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    interactive: z.boolean().default(true),
  }),
})

export const collections = { sketches }
