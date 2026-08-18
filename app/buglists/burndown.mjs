import * as BugList from "buglist";
import * as Releases from "releases";

export function init($container) {
    for (const chan of Releases.channels()) {
        BugList.append({
            id: `burndown-${chan.name}`,
            $container: $container,
            title: `${chan.version} (${chan.title}) Burndown List`,
            description:
                "Bugs with all of the following:\n" +
                "- resolved as fixed\n" +
                `- status-firefox${chan.version} is affected or optional\n` +
                "- any of:\n" +
                "\u00A0\u00A0- crash regression leak topcrash assertion dataloss keywords\n" +
                "\u00A0\u00A0- in a security group\n" +
                `\u00A0\u00A0- tracking-firefox${chan.version} is + ? or blocking\n` +
                "Bugs with any of the following are ignored:\n" +
                "- within the Testing product\n" +
                "Bugs are order by creation date, oldest first.",
            query: {
                classification: [
                    "Client Software",
                    "Components",
                    "Developer Infrastructure",
                    "Other",
                    "Server Software",
                ],
                resolution: "FIXED",
                f1: `cf_status_firefox${chan.version}`,
                o1: "anywords",
                v1: "affected optional",
                j2: "OR",
                f2: "OP",
                o3: "anywords",
                v3: "crash regression leak topcrash assertion dataloss",
                f3: "keywords",
                f4: "bug_group",
                o4: "substring",
                v4: "sec",
                f6: `cf_tracking_firefox${chan.version}`,
                o6: "anywordssubstr",
                v6: "+ ? blocking",
                f7: "CP",
                f9: "product",
                o9: "notequals",
                v9: "Testing",
            },
        });
    }
}
