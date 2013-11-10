Digital Signage
===
A solution for displaying media in a nested file structure

##NodeJS Webserver
Hosts

##Raspberry Pi Client



##Getting Started

##Installation

####NodeJS Server

Prerequisites (Windows):
* [NodeJS](http://nodejs.org/download/) for Windows, 32-bit
* [Python 2.7](http://python.org/download/)
* Install [Visual Studio Express](http://www.microsoft.com/visualstudio/eng/downloads#d-2010-express)

Installation:

	git clone https://github.com/brhoads/DigitalSignage.git
	git checkout -b remotes/origin/master
	Add Python to System Path
	Open ports 8080 and 8124 in the firewall for in and outbound traffic
	npm install
	-- Run as Service --
	.\node_modules\.bin\winser -i
	net start digital-signage
	-- Run as User (Debugging) --
	Open terminal in admin mode
	node server.js
	
####Raspberry Pi

Installation:
* Use `win32diskimager` to flash any [Openelec 3.2.x](http://openelec.tv/get-openelec/download/viewcategory/10-raspberry-pi-builds) image to an SD card
* Boot the Pi with the vanilla OpenELEC image and configure hostname, etc
* Navigate to the pictures panel to get rid of the "first time" screen
* Put SD card back in PC and copy `KERNEL` and `SYSTEM` on top of the files on the SD card
* Rename `KERNEL` to `kernel.img`
* Boot the Pi with the SD card and go to the Digital Signage settings
* Configure Server IP, Location, Org, and Isolation
* Change the skin to "DigitalSignage" (currently in a testing only phase)
* Reboot Pi 
* Enjoy the signage (maybe. reboot as needed)