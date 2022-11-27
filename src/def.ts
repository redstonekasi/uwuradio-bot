import { ApplicationCommandOptionData, ChatInputCommandInteraction, Client, ClientOptions, ColorResolvable, EmbedField, EmbedFooterOptions } from "discord.js";

export interface CommandOptions {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  dm?: boolean;
  su?: boolean;
  noAck?: boolean;
  ephemeral?: boolean;
  handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class Command {
  public name: string;
  public description: string;
  public options?: ApplicationCommandOptionData[];
  public dm?: boolean = true;
  public su?: boolean;
  public noAck?: boolean = false;
  public ephemeral?: boolean = false;
  public handler: (interaction: ChatInputCommandInteraction) => Promise<void>;

  public constructor(co: CommandOptions) {
    this.name = co.name;
    this.description = co.description;
    this.options = co.options;
    this.dm = co.dm;
    this.su = co.su;
    this.noAck = co.noAck;
    this.ephemeral = co.ephemeral;
    this.handler = co.handler;
  };
}

export type StatusEmbedType = "info" | "success" | "warn" | "error";

export interface StatusEmbedOptions {
    type: StatusEmbedType;
    title?: string;
    description?: string;
    fields?: EmbedField[];
    footer?: EmbedFooterOptions;
    color?: ColorResolvable;
}

export interface Song {
  name: string;
  artist: string;
  album?: string;
  dlUrl: string;
  sourceUrl: string;
  artUrl?: string;
  submitter: string;
}

export interface Submitter {
  name: string;
  pfpUrl: string;
  quotes: string[];
}

export interface Config {
  // [index: string]: any;
  token: string;
  endpoint: string;
  sudoers: string[];
  log: string;
  channels: Record<string, string>;
}

export interface RadioClientOptions extends ClientOptions {
  config: Config;
}

export class RadioClient extends Client {
  config: Config;
  
  public constructor(options: RadioClientOptions) {
    super(options);

    this.config = options.config;
  }
}
