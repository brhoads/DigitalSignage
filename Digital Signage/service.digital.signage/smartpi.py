import os
import urllib2
import xbmc
import xbmcaddon

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
__resource__   = xbmc.translatePath( os.path.join( __cwd__, 'resources', 'lib' ).encode("utf-8") ).decode("utf-8")

PORT = '8124'

class XBMCPlayer(xbmc.Player):
	#Subclass of XBMC.Player.
	#   OVERRIDES: onplayback events
	
	def __init__(self, *args):
		pass
	def onPlayBackEnded( self ):
		xbmc.log("Playback Ended")
		self.playSignage()
	def playSignage( self ):
		xbmc.log("Playing Media")
		xbmc.executebuiltin('ActivateWindow(Pictures,"/media/piFolders/'+__addon__.getSetting("PiDee")+'")')
		xbmc.executebuiltin("Action(Play)")
		
		##Enable below to play recursive slides, doesn't play video in Frodo
		#xbmc.executebuiltin('Action(Left)')
		#xbmc.executebuiltin('Action(Down)')
		#xbmc.executebuiltin('Action(Down)')
		#xbmc.executebuiltin('Action(Down)')
		#xbmc.executebuiltin('Action(Down)')
		#xbmc.executebuiltin('Action(Down)')
		#xbmc.executebuiltin('Action(Select)')
		
		#xbmc.executebuiltin('xbmc.SlideShow('+"/media/piFolders/"+__addon__.getSetting("PiDee")+')')
		#xbmc.executebuiltin('SlideShow("/media/piFolders/9","recursive")')
		#listing = os.listdir("/media/piFolders/"+__addon__.getSetting("PiDee"))
		#for infile in listing:
		#	filepath = "/media/piFolders/"+__addon__.getSetting("PiDee")+"/"+infile
		#	self.play( filepath )
		#xbmc.executebuiltin('xbmc.playmedia('+"/media/piFolders/"+__addon__.getSetting("PiDee")+"/"+infile+')')
		#	xbmc.log("Filepath"+filepath)
		#	time.sleep(5)		
def phoneHome():
    #gather information such as Pi IP Address and settings information from addon
    piip = xbmc.getIPAddress()
    location = __addon__.getSetting("Location")
    org = __addon__.getSetting("Org")
    piDee = __addon__.getSetting("PiDee")
    serverIP = __addon__.getSetting("ServerIP")
    
    pidentity = {'location' : location, 'org' : org, 'piip' : piip, 'piDee' : piDee}
    
    data = location, piip, org
    
    print data
     
    req = urllib2.Request('http://' + serverIP + ':'+PORT)
    req.add_header('Content-Type', 'application/json')
    response = urllib2.urlopen(req, simplejson.dumps(pidentity))
    print response

#Standard setup of main
if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)
    xbmc.log('Digital Signage add-on is active')
    #time.sleep(10)

    #If succesful the NodeJS server will tell the Pi to play
    phoneHome()

    #dsPlayer = XBMCPlayer()
    #xbmc.log("Created Digital Signage Player")
    #dsPlayer.playSignage()
