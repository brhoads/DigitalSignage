import re
import os
import sys
import time
import binascii
import urllib
import urllib2
from collections import deque
import xbmc
import xbmcaddon
import xbmcgui
import socket


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

#sys.path.append(__resource__)

def watchdog():
    while (not xbmc.abortRequested):
        if (xbmc.Player().isPlaying()):
            print 'VIDEO IS PLAYING'
            time.sleep(5)
        else:
            print 'NO MEDIA IS PLAYING...REDO PIDENTITIES'
            xbmc.Player().play('C:\\Wildlife.wmv')
    time.sleep(30)


    


#Standard setup of main
if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)
    print "Digital Signage add-on is active"
 
    #gather information such as Pi IP Address and settings information from addon
    piip = socket.gethostbyname(socket.gethostname())
    location = __addon__.getSetting("Location")
    org = __addon__.getSetting("Org")
    piDee = __addon__.getSetting("PiDee")
    
    pidentity = {'location' : location, 'org' : org, 'piip' : piip, 'piDee' : piDee}
    
    data = location, piip, org
    
    print data
     
    req = urllib2.Request('http://10.128.1.137:8124')
    req.add_header('Content-Type', 'application/json')
    print simplejson.dumps(pidentity)
    response = urllib2.urlopen(req, simplejson.dumps(pidentity))
    print response
	#time.sleep(5)
	
    #watchdog()
 
    # Emergency Alert
    # req2 = urllib2.Request('http://192.168.126.128:8080')
    # req2.add_header('Content-Type','application/html')
    # print 'BANANA'
    # response2 = urllib2.urlopen(req2, 'GOOBER')
    # print response2