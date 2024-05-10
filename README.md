# Firebot Better Random Media Custom Script

## A custom script that adds an improved `Play Random Video` and `Play Random Sound` effect with proper folder randomness and effect output support

### How to install
1. Go to the [releases](https://github.com/Lordmau5/firebot-script-better-random-video/releases/) tab and download the latest `better-random-media.js`
2. Open Firebot and head to Settings -> Scripts -> Manage Startup Scripts
3. Click `Add New Script`
4. Click on the `scripts folder` link in the popup and place the `better-random-media.js` inside
5. Click the blue reload button next to the `Pick one` dropdown to refresh the available scripts
6. Select `better-random-media.js` in the dropdown
7. Click `Save` - You might have to restart Firebot for the script to load.
___

### How to use `Play Random Video`
This effect works similarly to the integrated `Play Video` effect.

However, it keeps track of which videos in a folder it already played and will make sure that every video plays at least once.  
Once no videos are left, it will clear the list and start over.

Additionally, this effect has effect outputs.  
For now, it only has `$effectOutput[videoLength]` to get the length of the played video and use it in another effect, such as `Show Text`.

An added bonus is that it also supports a single video file so you can use the effect outputs for that, too.
___

### How to use `Play Random Sound`
This effect works similarly to the integrated `Play Sound` effect.

However, it keeps track of which sounds in a folder it already played and will make sure that every sound plays at least once.  
Once no sounds are left, it will clear the list and start over.

Additionally, this effect has effect outputs.  
For now, it only has `$effectOutput[soundLength]` to get the length of the played sound and use it in another effect, such as `Show Text`.

An added bonus is that it also supports a single sound file so you can use the effect outputs for that, too.