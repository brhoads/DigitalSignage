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


#Standard setup of main
if (__name__ == "__main__"):
    xbmc.log('Version %s started' % __addonversion__)
    print "Setting the PiDee"
 
    try:
        xbmc.log('## arg 0: %s' % sys.argv[0])
        xbmc.log('## arg 1: %s' % sys.argv[1])
        piDee = __addon__.setSetting("PiDee", sys.argv[1])
    except:
        pass
 
   
   