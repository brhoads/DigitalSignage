import sys
import subprocess
import time
import xbmc
import xbmcaddon
import xbmcgui

if sys.version_info < (2, 7):
    import simplejson
else:
    import json as simplejson

    
#This is the detailed info that XBMC is looking for when Addon is installed.
__addon__        = xbmcaddon.Addon(id='service.digital.signage')
__addonid__      = __addon__.getAddonInfo('id')
__addonversion__ = __addon__.getAddonInfo('version')
__addonname__    = __addon__.getAddonInfo('name')
__author__       = __addon__.getAddonInfo('author')
__icon__         = __addon__.getAddonInfo('icon')
__cwd__          = __addon__.getAddonInfo('path').decode("utf-8")

class XBMCPlayer(xbmc.Player):
	#Subclass of XBMC.Player.
	# OVERRIDES: onPlayBackEnded
	def __init__(self, *args):
		pass
	def onPlayBackStopped( self ):
		xbmc.log("Playback Ended")
		if(xbmc.Player().isPlaying()):
			xbmc.log("Not really, the video just ended")
		else:
			xbmc.log("Really stopped playing")
			self.playSignage()
	def playSignage(self):
		time.sleep(5)
		xbmc.log("Playing Media")
		xbmc.executebuiltin('ActivateWindow(Pictures,"/media/piFolders/'+__addon__.getSetting("PiDee")+'")')
		xbmc.executebuiltin("Action(Play)")

def setPiDee(piDee):
	try:
		__addon__.setSetting("PiDee", piDee[1])
		xbmc.log("PiDee set to "+piDee[1])
		time.sleep(3)
	except:
		xbmc.log("Unable to set pidee to "+piDee[1])		
def dumpSettings():
	xbmc.log("Sending back contents of settings file")
def playEmergency(args):
	xbmc.log("Emergency playing")
	#Ensure the TV is on
	subprocess.call("echo 'on 0' | cec-client -s", shell=True)
	xbmc.executebuiltin('ActivateWindow(Pictures,"/media/piFilling/EmergencyOverride")')
 	xbmc.executebuiltin("Action(Play)")
def playIPTV(args):
	xbmc.log("IPTV playing")

digitalSignagePlayer = XBMCPlayer()
xbmc.log("Create Digital Signage Player")
#Standard setup of main
if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)

    try:
    	if(sys.argv[1] == "piDee"):
		setPiDee(sys.argv[1:])
    	elif(sys.argv[1] == "play"):
		digitalSignagePlayer.playSignage()
	elif(sys.argv[1] == "settings"):
		dumpSettings()
	elif(sys.argv[1] == "emergency"):
		playEmergency(sys.argv[1:])
    	elif(sys.argv[1] == "iptv"):
		playIPTV(sys.argv[1:])
    	else:
		xbmc.log("Unknown overrides command "+sys.argv[1])
		xbmc.executebuiltin('Notification("Digital Signage","Unknown overrides command",5000)')
    except:
	xbmc.log("error understanding override")

    while( not xbmc.abortRequested):
	xbmc.sleep(100)
