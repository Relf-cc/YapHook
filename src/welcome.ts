import { MessageS, newEmbed, newField, newMessage } from "./model";

/** The message shown on first visit. */
export function welcome(): MessageS[] {
  return [
    newMessage({
      content: "Hey there! 👋 Welcome to **YapHook**, the message builder for **Yapin'** webhooks.",
      embeds: [
        newEmbed({
          authorName: "YapHook",
          title: "Build great-looking webhook messages",
          url: "https://yapin.gg",
          description:
            "Edit anything on the left and watch it update here.\n\n" +
            "- **Bold**, *italic*, __underline__, ~~strike~~, ||spoilers||\n" +
            "- `inline code` and [masked links](https://yapin.gg)\n" +
            "- Timestamps like <t:1767225600:R>\n\n" +
            "> Paste your webhook URL above, then hit **Send**.",
          fields: [
            newField({ name: "Embeds", value: "Up to 10 per message", inline: true }),
            newField({ name: "Fields", value: "Up to 25 per embed", inline: true }),
            newField({ name: "Share", value: "Copy a link to this exact message", inline: true }),
          ],
          footerText: "YapHook · yaphook.dev",
          timestamp: new Date().toISOString(),
        }),
      ],
    }),
  ];
}
