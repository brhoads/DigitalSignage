Digital Signage
===
A solution for displaying media in a nested file structure

##NodeJS Webserver
Hosts

##Raspberry Pi Client
Pi

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
	cd VADER
	Add Python to System Path
	Open ports 8080 and 8124 in the firewall for in and outbound traffic
	npm install
	-- Run as Service --
	.\node_modules\.bin\winser -i
	net start digital-signage
	-- Run as User (Debugging) --
	Open terminal in admin mode
	node PiBrains.js
	
####Raspberry Pi

Prerequisites:
* [OpenElec] (http://openelec.tv/get-openelec/download/viewcategory/10-raspberry-pi-builds) installed on a Raspberry Pi. The addon should work with any XBMC client, however it has only be tested with OpenELEC on the Raspberry Pi. 

Installation: 
	Use scp to copy service.digital.signage/ to /storage/.xbmc/addons/
