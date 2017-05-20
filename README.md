## Anonymer Tweet Bot

Dieser Bot, geschrieben in NodeJS ermöglicht dem Nutzer das Senden von anonymen Tweets über Telegram oder Twitter. Dabei werden die empfangenen Nachrichten über den Twitter/Telegram Stream ausgelesen, je nach Art (Bild, Sticker, ..) geparsed und als Tweet über einen anderen API Zugriff versendet mit Text (ohne/und/oder) Bild.
Die weiteren Funktionen, wie das Konvertieren von WEBP Stickern von Telegram in PNG Bilder für Twitter sind ebenfalls als selbstgeschriebene Elemente asynchron in diesem Projekt enthalten.

## Motivation

Dieses Projekt diente lediglich zur Einweisung in NodeJS als eines der ersten Projekte seitens der Verwendung von den require-Funktionen, den einzelnen Paketen, ...

## Installation

Sie benötigen zum Ausführen dieses Projektes einen Twitter Client und einen Telegram Bot. Um eine frühzeitige Twitter-App-Sperrung zu widergehen empfehle ich zwei Apps zu erstellen, eine zum senden der Tweets, eine zum auslesen. Diese kann man mit dem jeweiligen Twitter Account auf (https://apps.twitter.com/) erstellen. Man benötigt für die erstmale Erstellung einer App eine Telefonnummer zur Verifizierung des Twitter Accounts.
Für die App, die zur Auslese der DM's zuständig ist, werden noch Zugriffsrechte für die DM's verlangt. Weitere Informationen auf den jeweiligen Seiten.
Einen Telegrambot erstellt man mit dem sogenannten "BotFather", welchen man über t.me/BotFather erreichen kann. Man erhält dann nach der Erstellung einen Token, den man in /utils/config.js einsetzt.

## Entwicklung und Pakete

Dieses Projekt wurde von DEMineforce (https://twitter.com/DEMineforce) umgesetzt mit folgenden NPM Paketen:
    - Node-Telegram-Bot-API
    - Twit
    - Twitter
    - WebP-Converter

## Lizenz

Dieses Projekt basiert auf die MIT Lizenz. Weitere Informationen: https://opensource.org/licenses/MIT