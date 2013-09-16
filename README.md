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

	git clone https://github.com/brhoads/VADER.git
	git checkout -b remotes/origin/DigitalSignage
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