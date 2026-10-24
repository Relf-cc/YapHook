// Ready-made messages the help page can load into the builder. Starting from
// something that already works beats staring at an empty editor.

import { MessageS, newEmbed, newField, newMessage } from "./model";

export interface Example {
  id: string;
  name: string;
  blurb: string;
  /** Extra words for the help search. */
  keywords: string;
  build: () => MessageS[];
}

const inDays = (n: number) => Math.floor(Date.now() / 1000) + n * 86400;

export const EXAMPLES: Example[] = [
  {
    id: "plain",
    name: "Plain message",
    blurb: "Just text, with a custom name and avatar. The simplest thing a webhook can post.",
    keywords: "content text username avatar simple",
    build: () => [
      newMessage({
        username: "Server Bot",
        avatarUrl: "https://yapin.gg/favicon.ico",
        content:
          "**Heads up!** The server is getting a fresh coat of paint in a moment.\n" +
          "-# Nothing to do on your end — it should take about five minutes.",
      }),
    ],
  },
  {
    id: "announcement",
    name: "Announcement embed",
    blurb: "A titled card with a description, a thumbnail and a footer timestamp. The everyday embed.",
    keywords: "embed announcement title description footer thumbnail colour",
    build: () => [
      newMessage({
        content: "@everyone",
        embeds: [
          newEmbed({
            authorName: "Announcements",
            title: "Season 4 starts this weekend",
            url: "https://yapin.gg",
            color: "#ff6b4a",
            description:
              "Queues open on **Saturday at noon** and the new map rotation goes live at the same time.\n\n" +
              "- Fresh ranks for everyone\n" +
              "- Two new maps\n" +
              "- Weekly challenges return\n\n" +
              "> Read the full notes in #patch-notes.",
            footerText: "Posted by the mod team",
            timestamp: new Date().toISOString(),
          }),
        ],
      }),
    ],
  },
  {
    id: "event",
    name: "Event with timestamps",
    blurb: "Shows `<t:…>` timestamps, which every reader sees in their own time zone.",
    keywords: "event timestamp time zone relative schedule countdown fields inline",
    build: () => [
      newMessage({
        embeds: [
          newEmbed({
            title: "📅 Game night",
            color: "#5aa9e6",
            description: `Starts <t:${inDays(3)}:F> — that's <t:${inDays(3)}:R>.\n\nReact in the channel if you're coming.`,
            fields: [
              newField({ name: "When", value: `<t:${inDays(3)}:f>`, inline: true }),
              newField({ name: "Where", value: "Voice · The Lounge", inline: true }),
              newField({ name: "Bring", value: "Snacks and a good attitude", inline: true }),
            ],
            footerText: "Times shown in your local time zone",
          }),
        ],
      }),
    ],
  },
  {
    id: "rules",
    name: "Rules post",
    blurb: "A long embed built from fields, the usual shape for a rules or info channel.",
    keywords: "rules fields info welcome long list",
    build: () => [
      newMessage({
        embeds: [
          newEmbed({
            title: "Server rules",
            color: "#3fcf82",
            description: "Read these before posting. Breaking them gets you a warning, then a timeout.",
            fields: [
              newField({ name: "1 · Be decent", value: "No harassment, slurs or witch hunts. Disagree without being a pain." }),
              newField({ name: "2 · Keep it on topic", value: "Each channel has a purpose — check the topic if you're unsure." }),
              newField({ name: "3 · No spam", value: "That includes self-promo, chain pings and walls of emoji." }),
              newField({ name: "4 · Safe for work", value: "No NSFW content anywhere in the server." }),
              newField({ name: "5 · Mods have the last word", value: "Take disagreements to DMs with a mod, not the channel." }),
            ],
            footerText: "Last updated",
            timestamp: new Date().toISOString(),
          }),
        ],
      }),
    ],
  },
  {
    id: "status",
    name: "Status update",
    blurb: "Compact inline fields and a coloured sidebar — handy for deploys, uptime or ticket bots.",
    keywords: "status deploy monitoring inline fields colour green incident",
    build: () => [
      newMessage({
        username: "Status",
        embeds: [
          newEmbed({
            authorName: "yaphook.dev",
            title: "✅ All systems normal",
            color: "#3fcf82",
            fields: [
              newField({ name: "Uptime", value: "99.98%", inline: true }),
              newField({ name: "Latency", value: "`42 ms`", inline: true }),
              newField({ name: "Version", value: "`1.4.2`", inline: true }),
            ],
            footerText: "Checked",
            timestamp: new Date().toISOString(),
          }),
        ],
      }),
    ],
  },
  {
    id: "sequence",
    name: "Two messages in a row",
    blurb: "A sequence sent in one go: an image post followed by a short note from the same profile.",
    keywords: "multiple messages sequence image banner order grouped",
    build: () => [
      newMessage({
        username: "Gallery",
        embeds: [
          newEmbed({
            title: "Map of the week: Tidewater",
            color: "#9b59ff",
            description: "Submitted by **@cartographer**.",
            image: "https://picsum.photos/seed/yaphook/900/400",
          }),
        ],
      }),
      newMessage({
        username: "Gallery",
        content: "Want yours featured? Post it in the submissions channel. ||We read every single one.||",
      }),
    ],
  },
];
