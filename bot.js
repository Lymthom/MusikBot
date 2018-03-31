const Discord = require('discord.js');
const { Client, Util} = require('discord.js');
const config = require("./config.json");
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true});

const youtube = new YouTube(config.GOOGLE_API_KEY);
const PREFIX = config.prefix;

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('I am ready!'));

client.on('disconnect', () => console.log('I disconnected!'));

client.on('reconnecting', () => console.log('I am disconnecting!'));

client.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel
  const serverQueue = queue.get(oldMember.guild.id);


  if(oldUserChannel === undefined && newUserChannel !== undefined) {

     // User Joins a voice channel
     // console.log(serverQueue.mute);
     // if(serverQueue && serverQueue.connection != null){
      //    console.log('test1');
     //       if((serverQueue.mute == false) && (newMember !== '428159852213174272')){
     //           console.log('test2');
     //           serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 2000);
     //       }
    //  }

  } else if(newUserChannel === undefined){

    // User leaves a voice channel
      if(oldMember.id === '428159852213174272'){
          return console.log("BOT");
      }
      else{
          if(client.guilds.get(oldMember.guild.id).voiceConnection != null){
              if(client.guilds.get(oldMember.guild.id).voiceConnection.channel.id === oldUserChannel.id){
                    if(oldUserChannel.members.size < 2){
                        serverQueue.songs = [];
                        serverQueue.connection.dispatcher.end('No members left in the channel!')
                    }    
              }else{
                  return console.log('nicht im gleichen voiceChannel');
              }
          }else{
              return undefined;
          }
        //return console.log(client.guilds.get(oldMember.guild.id).voiceConnection.channel.id);
      }
         

  }
})

client.on('message', async msg => { // eslint-disable-line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1];
    const serverQueue = queue.get(msg.guild.id);
    
    if(msg.content.startsWith(`${PREFIX}play`)){
        const voiceChannel = msg.member.voiceChannel;
        //return console.log(voiceChannel);
        //return console.log(voiceChannel.members.size);
        if(!voiceChannel){
            var embedplay1 = new Discord.RichEmbed()
                .setTitle(`**Man muss in einem VoiceChannel sein um Musik abspielen zu können!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedplay1);
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')){
            var embedplay2 = new Discord.RichEmbed()
                .setTitle(`**Mir fehlt das Recht CONNECT, um in diesen VoiceChannel zu connecten!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedplay2);
        }
        if (!permissions.has('SPEAK')){
            var embedplay3 = new Discord.RichEmbed()
                .setTitle(`**Mir fehlt das Recht SPEAK, um in diesen VoiceChannel zu connecten!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedplay3);
        }
        
        if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)){
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for(const video of Object.values(videos)){
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            var embedplay4 = new Discord.RichEmbed()
                .setTitle(`**Playlist: ${playlist.title} wurde der Warteschlange hinzugefügt!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedplay4);
        }else{
            try{
                var video = await youtube.getVideo(url);
            }catch(error){
                try{
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    var embedqueue5 = new Discord.RichEmbed()
                        .setTitle(`__**Song Auswahl**__`)
                        .setDescription(`
${videos.map(video2 => `**${++index}-** ${video2.title}`).join('\n')}

**Bitte gib eine Zahl zwischen 1-10 ein, um einen Song auszuwählen!**`)
                .setColor([250, 0, 0])
                    msg.channel.sendEmbed(embedqueue5);
//                    msg.channel.send(`
//__**Song Auswahl**__
//${videos.map(video2 => `**${++index}-** ${video2.title}`).join('\n')}
//
//**Bitte gib eine Zahl zwischen 1-10 ein, um einen Song auszuwählen!**
//                    `);
                    
                    try{
                       var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                           maxMatches: 1,
                           time: 10000,
                           errors: ['time']
                       }); 
                    }catch(err){
                        console.error(err);
                        var embedplay6 = new Discord.RichEmbed()
                            .setTitle(`**Es wurde keine oder eine invalide Zahl eingegeben. Abbruch der Songauswahl!**`)
                            .setColor([250, 0, 0])
                        return msg.channel.sendEmbed(embedplay6);
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                }catch(err){
                    console.error(err);
                    var embedplay7 = new Discord.RichEmbed()
                        .setTitle(`**Ich konnte kein Video finden!**`)
                        .setColor([250, 0, 0])
                    return msg.channel.sendEmbed(embedplay7);
                    //return msg.channel.send('Ich konnte kein Video finden!');
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
        //return console.log(video); Um z.b. thumbnail herauszufinden!
    
    } else if(msg.content.startsWith(`${PREFIX}skip`)) {
        if(!msg.member.voiceChannel){
           var embedskip1 = new Discord.RichEmbed()
                .setTitle(`**Du bist in nicht in dem VoiceChannel!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedskip1); 
        }
        if(!serverQueue){
            var embedskip2 = new Discord.RichEmbed()
                .setTitle(`**Es gibt nichts zum überspringen!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedskip2);
        }
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        var embedskip3 = new Discord.RichEmbed()
            .setTitle(`**Der Song wurde übersprungen!**`)
            .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedskip3);
    }   
        
     else if (msg.content.startsWith(`${PREFIX}stop`)){
        if(!msg.member.voiceChannel){
           var embedstop1 = new Discord.RichEmbed()
                .setTitle(`**Du bist in nicht in dem VoiceChannel!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedstop1); 
        }
        if(!serverQueue){
            var embedstop2 = new Discord.RichEmbed()
                .setTitle(`**Es gibt nichts zum stoppen!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedstop2);
        }
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        var embedstop3 = new Discord.RichEmbed()
            .setTitle(`**Der Bot wurde gestoppt!**`)
            .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedstop3);
    }
    else if(msg.content.startsWith(`${PREFIX}song`)){
        if(!serverQueue){
            var embedsong1 = new Discord.RichEmbed()
                .setTitle(`**Es spielt im Moment nichts!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedsong1);
                 }
            var embedsong2 = new Discord.RichEmbed()
                .setTitle(`__**${serverQueue.songs[0].title}**__`)
                .setThumbnail(serverQueue.songs[0].thumbnail)
                .setDescription(`
Von: ${serverQueue.songs[0].channel}
Dauer: ${serverQueue.songs[0].duration}
Link: ${serverQueue.songs[0].url}
`)
                .setColor([250, 0, 0])
              return msg.channel.sendEmbed(embedsong2);
    }
    else if(msg.content.startsWith(`${PREFIX}volume`)){
        if(!serverQueue){
            var embedvolume1 = new Discord.RichEmbed()
                .setTitle(`**Es spielt im Moment nichts!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedvolume1);}
        if(!args[1]){
             var embedvolume2 = new Discord.RichEmbed()
                .setTitle(`**Die aktuelle Lautstärke beträgt: ${serverQueue.volume}**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedvolume2);
        }
        
        if(args[1]>0){
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 2000);
        serverQueue.mute = false;
        var embedvolume3 = new Discord.RichEmbed()
                .setTitle(`**Die Lautstärke wird auf ${args[1]} gesetzt**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedvolume3);
        } else{
            var embedvolume4 = new Discord.RichEmbed()
                .setTitle(`**Bitte gib eine Zahl >0 ein!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedvolume4);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}queue`)){
        if(!serverQueue){
            var embedqueue1 = new Discord.RichEmbed()
                .setTitle(`**Es spielt im Moment nichts!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedqueue1);
        }
        var embedqueue2 = new Discord.RichEmbed()
                .setTitle(`__**Song Queue**__`)
                .setDescription(`
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Am spielen:** ${serverQueue.songs[0].title}`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedqueue2);
    }
    else if(msg.content.startsWith(`${PREFIX}pause`)){
        if(serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        var embedpause1 = new Discord.RichEmbed()
                .setTitle(`**Das Lied wird angehalten!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedpause1);
        }
        var embedpause2 = new Discord.RichEmbed()
            .setTitle(`**Es spielt im Moment nichts!**`)
            .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedpause2);
    }
    else if(msg.content.startsWith(`${PREFIX}resume`)){
        if(serverQueue && !serverQueue.playing){
        serverQueue.playing = true;
        serverQueue.connection.dispatcher.resume();
        var embedresume1 = new Discord.RichEmbed()
                .setTitle(`**Das Lied spielt weiter ab!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedresume1);           
        }
        var embedresume2 = new Discord.RichEmbed()
            .setTitle(`**Es spielt im Moment nichts!**`)
            .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedresume2);
    }   
    else if(msg.content.startsWith(`${PREFIX}mute`)){
        if(!serverQueue){
        var embedmute1 = new Discord.RichEmbed()
                .setTitle(`**Es spielt im Moment nichts!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedmute1);     
        }
        if(serverQueue.mute){
        var embedmute2 = new Discord.RichEmbed()
                .setTitle(`**Der Musik Bot ist bereits gemuted!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedmute2);     
        }
        else{
            serverQueue.mute = true;
            serverQueue.connection.dispatcher.setVolume(0 / 2000);
            var embedmute3 = new Discord.RichEmbed()
                .setTitle(`**Der Musik Bot wurde gemuted!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedmute3);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}unmute`)){
        if(!serverQueue){
            var embedunmute1 = new Discord.RichEmbed()
                .setTitle(`**Es spielt im Moment nichts!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedunmute1);     
        }
        if(!serverQueue.mute){
            var embedunmute2 = new Discord.RichEmbed()
                .setTitle(`**Der Musik Bot ist bereits unmuted!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedunmute2);     
        }   
        else{
            serverQueue.mute = false;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 2000);
            var embedunmute3 = new Discord.RichEmbed()
                .setTitle(`**Der Musik Bot wurde unmuted!**`)
                .setColor([250, 0, 0])
        return msg.channel.sendEmbed(embedunmute3);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}help`)){
        var embedhelp = new Discord.RichEmbed()
            .setTitle(`__**Musik Bot Commands**__`)
            .addField("!play [YouTube Link/Playlist]", "Reiht das Lied in die Warteschlange", false)
            .addField("!play [Suchbegriff(e)]", "Gibt 10 Suchergebnisse aus. Auswahl wird an Warteschlange angereiht", false)
            .addField("!skip", "Überspringt aktuellen Song", false)
            .addField("!stop", "Bot disconnected", false)
            .addField("!song", "Gibt den aktuell laufenden Song aus", false)
            .addField("!queue", "Gibt die aktuelle Warteschlange aus", false)
            .addField("!volume", "Gibt die aktuelle Lautstärke aus", false)
            .addField("!volume [Wert]", "Ändert die lautstärke auf den gegebenen Wert", false)
            .addField("!pause", "Hält den aktuell laufenden Song an", false)
            .addField("!resume", "Spielt den aktuell angehaltenen Song weiter ab", false)
            .addField("!mute", "Muted den Bot", false)
            .addField("!unmute", "Unmuted den Bot", false)
            .setColor([250, 0, 0])
            .setThumbnail(client.user.avatarURL)
            return msg.channel.sendEmbed(embedhelp);
    }
    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist=false){
    const serverQueue = queue.get(msg.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnails.default.url,
        channel: video.channel.title,
        duration: `${video.duration.hours}:${video.duration.minutes}:${video.duration.seconds}`
    };
    if(!serverQueue){
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            mute: false,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try{
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        }catch(error){
            console.log(error);
            queue.delete(msg.guild.id);
            var embedfunc1 = new Discord.RichEmbed()
                .setTitle(`**Bot konnte dem VoiceChannel nicht joinen!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedfunc1);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if(playlist) return undefined;
        else{
            var embedfunc2 = new Discord.RichEmbed()
                .setTitle(`**${song.title} wurde der Warteschlange hinzugefügt!**`)
                .setColor([250, 0, 0])
            return msg.channel.sendEmbed(embedfunc2);
        }
    }    
    return undefined;
}

function play(guild, song){
    const serverQueue = queue.get(guild.id);
    
    if(!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);
    
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', reason => {
                if(reason === 'Stream is not generating quickly enough.') console.log('Song ended');
                else console.log(reason);
                serverQueue.songs.shift();
                setTimeout(() => {
                play(guild, serverQueue.songs[0]);
                }, 250);
            })
            .on('error', error => console.log(error)); 
            
    //dispatcher.setVolumeLogarithmic(serverQueue.volume / 2000);
    dispatcher.setVolume(serverQueue.volume / 2000);
    
    var embedfunction1 = new Discord.RichEmbed()
                .setTitle(`**Fange an ${song.title} zu spielen**`)
                .setColor([250, 0, 0])
            return serverQueue.textChannel.sendEmbed(embedfunction1);
    //serverQueue.textChannel.send(`Fange an **${song.title}** zu spielen`);
}

client.login(process.env.BOT_TOKEN);
