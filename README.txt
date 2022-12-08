  __  ___      ____  __
 / / / / | /| / / / / /
/ /_/ /| |/ |/ / /_/ / 
\__,_/ |__/|__/\__,_/  
      radio bot

 Introduction
===============

This is a bot for uwu radio (found at https://radio.uwu.network).

     Usage
===============

   Hosted
------------
Invite the bot here: https://discord.com/oauth2/authorize?client_id=1045796505535135855&permissions=3145728&scope=bot%20applications.commands

 Selfhosted
------------
Use the docker image "ghcr.io/redstonekasi/uwuradio-bot:main".
An example docker-compose.yml is provided, read it for all the available options.

Or self-host it like this:
 1. Fill out data/config.json (see Configuration)
 2. Install dependencies: pnpm i
 3. Build: pnpm build
 4. Start the bot with: pnpm start

 Configuration
===============
The configuration file (data/config.json) has the following properties:
 - "token" The bots token.
 - "endpoint" The radio server endpoint.
 - "sudoers" A list of user ids permitted to use sudo commands.
 - "log" A channel to log errors that occur in.
 - "channels" Don't touch this one, it's used by the bot to remember the
              channels it's in.

    Credits
===============
A big thanks to Beef for Coffee - the bot used as a base for the command handler.
