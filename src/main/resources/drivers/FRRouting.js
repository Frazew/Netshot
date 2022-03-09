/**
 * Copyright 2013-2022 Sylvain Cadilhac (NetFishers)
 * 
 * This file is part of Netshot.
 * 
 * Netshot is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Netshot is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Netshot.  If not, see <http://www.gnu.org/licenses/>.
 */

var Info = {
	name: "FRRouting",
	description: "FRRouting",
	author: "mpechnikov",
	version: "1.0",
	discriminatorOid: "1.3.6.1.4.1.2620.1.6.5.1"
};

var Config = {
	"runningConfig": {
		type: "LongText",
		title: "Running configuration",
		comparable: true,
		searchable: true,
		checkable: true,
		dump: {
			pre: "!! Running configuration (taken on %when%):",
			post: "!! End of running configuration"
		}
	}
};

var Device = {};

var CLI = {
	ssh: {
		macros: {
			enable: {
				options: [ "enable", "disable" ],
				target: "enable"
			},
			configure: {
				options: [ "enable", "disable" ],
				target: "configure"
			}
		}
	},
	username: {
		prompt: /^Username: $/,
		macros: {
			auto: {
				cmd: "$$NetshotUsername$$",
				options: [ "password" ]
			}
		}
	},
	password: {
		prompt: /^Password: $/,
		macros: {
			auto: {
				cmd: "$$NetshotPassword$$",
				options: [ "usernameAgain", "disable", "enable" ]
			}
		}
	},
	usernameAgain: {
		prompt: /^Username: $/,
		fail: "Authentication failed - Telnet authentication failure."
	},
	disable: {
		prompt: /^([A-Za-z\-_0-9\.]+(\/[A-Za-z\-]+)?\> )$/,
		macros: {
			enable: {
				cmd: "enable",
				options: [ "enable", "disable", "enableSecret" ],
				target: "enable"
			},
			configure: {
				cmd: "enable",
				options: [ "enable", "disable", "enableSecret" ],
				target: "configure"
			}
		}
	},
	enableSecret: {
		prompt: /^Password: /m,
		macros: {
			auto: {
				cmd: "$$NetshotSuperPassword$$",
				options: [ "disable", "enable", "enableSecretAgain" ]
			}
		}
	},
	enableSecretAgain: {
		prompt: /^Password: /m,
		fail: "Authentication failed - Wrong enable password."
	},

	enable: {
		prompt: /^([A-Za-z\-_0-9\.]+(\/[A-Za-z\-]+)?# )$/,
		error: /^% (.*)/m,
		pager: {
			avoid: "terminal pager 0",
			match: /^<--- More --->$/,
			response: " "
		},
		macros: {
			configure: {
				cmd: "configure terminal",
				options: [ "enable", "configure" ],
				target: "configure"
			},
			save: {
				cmd: "copy running-config startup-config",
				options: [ "enable", "saveSource" ],
				target: "enable"
			}
		}
	},
	saveSource: {
		prompt: /Source filename \[running-config\]\?/,
		macros: {
			auto: {
				cmd: "",
				options: [ "enable" ]
			}
		}
	},

	configure: {
		prompt: /^([A-Za-z\-_0-9\.]+\/[A-Za-z\-]\(conf[0-9\-a-zA-Z]+\)# )$/,
		error: /^% (.*)/m,
		clearPrompt: true,
		macros: {
			end: {
				cmd: "end",
				options: [ "enable", "configure" ],
				target: "enable"
			}
		}
	}
};

function snapshot(cli, device, config) {

	cli.macro("enable");
	var showVersion = cli.command("show version");

	var hostname = showVersion.match(/^FRRouting (\d+\.\d+) \((.*)\)/m);
	if (hostname) {
		device.set("name", hostname[2]);
	}

	var version = showVersion.match(/^FRRouting (\d+\.\d+) \((.*)\)/m);
	version = (version ? version[1] : "Unknown");
	device.set("softwareVersion", version);

	device.set("family", "FRRouting");
	device.set("networkClass", "ROUTER");

	var configCleanup = function(config) {
		var p = config.search(/^[a-z]/m);
		if (p > 0) {
			config = config.slice(p);
		}
		return config;
	};

	var runningConfig = cli.command("show running-config");
	runningConfig = configCleanup(runningConfig);
	config.set("runningConfig", runningConfig);

};

function snmpAutoDiscover(sysObjectID, sysDesc) {
	if (sysObjectID == "1.3.6.1.4.1.8072.3.2.10" && sysDesc.match(/FRRouting/)) {
		return true;
	}
	return false;
}

function analyzeSyslog(message) {
	return false;
}

function analyzeTrap(trap, debug) {
	return false;
}
