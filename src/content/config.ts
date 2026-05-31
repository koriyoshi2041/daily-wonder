import { defineCollection, z } from 'astro:content'

const sketches = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    day: z.number().default(0),
    tags: z.array(z.string()).default([]),
    tools: z.array(z.string()).default(['p5.js']),
    thumbnail: z.string().default('/favicon.svg'),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    interactive: z.boolean().default(true),
  }),
})

export const collections = { sketches }
