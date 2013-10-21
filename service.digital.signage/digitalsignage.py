import os
import urllib2
import xbmc
import xbmcaddon
import overrides

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
    
    try: 
        req = urllib2.Request('http://' + serverIP + ':'+PORT)
        req.add_header('Content-Type', 'application/json')
        response = urllib2.urlopen(req, simplejson.dumps(pidentity))
        print response
    except:
	#Go ahead and play whatever media we knew about if urllib timeouts
	if (piDee != -1):
		overrides.digitalSignagePlayer.playSignage()    
	
#Standard setup of main
if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)
    xbmc.log('Digital Signage add-on is active')

    #If succesful the NodeJS server will tell the Pi to play
    #If unsuccesful the Pi will attempt to play what is in it's piFolder
    phoneHome()

