========================================
>>> .
========================================
[Diretório ou item especial]

========================================
>>> ./preferences.py
========================================
# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: preferences.py
import json

def getpreferences(item):
    with open('preferences.json', 'r') as (f):
        data = json.load(f)
    return data[item]


def setpreferences(item, value):
    with open('preferences.json', 'r') as (f):
        data = json.load(f)
    data[item] = value
    with open('preferences.json', 'w') as (f):
        json.dump(data, f)

========================================
>>> ./shadow.py
========================================
# reverse engineered from shadow.pyd
trueshadow_data = [
    b'\x88\x88\x88\nl\xfc\x9dF\xf8',
    b'\x00\x00H\x00Ntq@Q',
    b'utils\n_re',
    b'\x80\x02\x8a\nl\xfc\x9cF\xf9',
    b'legits\n_re',
    b'\xff\xffH\x00Ntq@Q',
    b'\x89"\x8f\nl\xfc\x9cF\xf9',
    b'register\n_re',
    b'\x99\x99H\x00Ntq@Q'
]

def trueshadow(i):
    return trueshadow_data[i]


========================================
>>> ./Append.sh
========================================
#!/bin/sh
# script_context.sh - Percorre recursivamente um diretório,
# lê arquivos e diretórios, e salva tudo em context.md

BASE_DIR="${1:-.}"          # Diretório base (padrão: atual)
OUTPUT_FILE="context.md"    # Nome do arquivo de saída

# Limpa (ou cria) o arquivo de saída
> "$OUTPUT_FILE"

# Percorre todos os itens (arquivos e diretórios)
find "$BASE_DIR" -print | while IFS= read -r item; do
    # Escreve o cabeçalho com o caminho do item
    echo "========================================" >> "$OUTPUT_FILE"
    echo ">>> $item" >> "$OUTPUT_FILE"
    echo "========================================" >> "$OUTPUT_FILE"
    
    # Se for um arquivo comum, lê e anexa o conteúdo
    if [ -f "$item" ]; then
        cat "$item" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"  # quebra de linha extra
    else
        # Se for diretório (ou outro tipo), apenas indica
        echo "[Diretório ou item especial]" >> "$OUTPUT_FILE"
    fi
    
    echo "" >> "$OUTPUT_FILE"   # linha em branco entre itens
done

echo "Pronto! Dados salvos em $OUTPUT_FILE"

========================================
>>> ./sensationalist_journalism.png

========================================
>>> ./.git/hooks
========================================
[Diretório ou item especial]

========================================
>>> ./.git/hooks/post-update.sample
========================================
#!/bin/sh
#
# An example hook script to prepare a packed repository for use over
# dumb transports.
#
# To enable this hook, rename this file to "post-update".

exec git update-server-info


========================================
>>> ./.git/hooks/sendemail-validate.sample
========================================
#!/bin/sh

# An example hook script to validate a patch (and/or patch series) before
# sending it via email.
#
# The hook should exit with non-zero status after issuing an appropriate
# message if it wants to prevent the email(s) from being sent.
#
# To enable this hook, rename this file to "sendemail-validate".
#
# By default, it will only check that the patch(es) can be applied on top of
# the default upstream branch without conflicts in a secondary worktree. After
# validation (successful or not) of the last patch of a series, the worktree
# will be deleted.
#
# The following config variables can be set to change the default remote and
# remote ref that are used to apply the patches against:
#
#   sendemail.validateRemote (default: origin)
#   sendemail.validateRemoteRef (default: HEAD)
#
# Replace the TODO placeholders with appropriate checks according to your
# needs.

validate_cover_letter () {
	file="$1"
	# TODO: Replace with appropriate checks (e.g. spell checking).
	true
}

validate_patch () {
	file="$1"
	# Ensure that the patch applies without conflicts.
	git am -3 "$file" || return
	# TODO: Replace with appropriate checks for this patch
	# (e.g. checkpatch.pl).
	true
}

validate_series () {
	# TODO: Replace with appropriate checks for the whole series
	# (e.g. quick build, coding style checks, etc.).
	true
}

# main -------------------------------------------------------------------------

if test "$GIT_SENDEMAIL_FILE_COUNTER" = 1
then
	remote=$(git config --default origin --get sendemail.validateRemote) &&
	ref=$(git config --default HEAD --get sendemail.validateRemoteRef) &&
	worktree=$(mktemp --tmpdir -d sendemail-validate.XXXXXXX) &&
	git worktree add -fd --checkout "$worktree" "refs/remotes/$remote/$ref" &&
	git config --replace-all sendemail.validateWorktree "$worktree"
else
	worktree=$(git config --get sendemail.validateWorktree)
fi || {
	echo "sendemail-validate: error: failed to prepare worktree" >&2
	exit 1
}

unset GIT_DIR GIT_WORK_TREE
cd "$worktree" &&

if grep -q "^diff --git " "$1"
then
	validate_patch "$1"
else
	validate_cover_letter "$1"
fi &&

if test "$GIT_SENDEMAIL_FILE_COUNTER" = "$GIT_SENDEMAIL_FILE_TOTAL"
then
	git config --unset-all sendemail.validateWorktree &&
	trap 'git worktree remove -ff "$worktree"' EXIT &&
	validate_series
fi


========================================
>>> ./.git/hooks/pre-applypatch.sample
========================================
#!/bin/sh
#
# An example hook script to verify what is about to be committed
# by applypatch from an e-mail message.
#
# The hook should exit with non-zero status after issuing an
# appropriate message if it wants to stop the commit.
#
# To enable this hook, rename this file to "pre-applypatch".

. git-sh-setup
precommit="$(git rev-parse --git-path hooks/pre-commit)"
test -x "$precommit" && exec "$precommit" ${1+"$@"}
:


========================================
>>> ./.git/hooks/pre-push.sample
========================================
#!/bin/sh

# An example hook script to verify what is about to be pushed.  Called by "git
# push" after it has checked the remote status, but before anything has been
# pushed.  If this script exits with a non-zero status nothing will be pushed.
#
# This hook is called with the following parameters:
#
# $1 -- Name of the remote to which the push is being done
# $2 -- URL to which the push is being done
#
# If pushing without using a named remote those arguments will be equal.
#
# Information about the commits which are being pushed is supplied as lines to
# the standard input in the form:
#
#   <local ref> <local oid> <remote ref> <remote oid>
#
# This sample shows how to prevent push of commits where the log message starts
# with "WIP" (work in progress).

remote="$1"
url="$2"

zero=$(git hash-object --stdin </dev/null | tr '[0-9a-f]' '0')

while read local_ref local_oid remote_ref remote_oid
do
	if test "$local_oid" = "$zero"
	then
		# Handle delete
		:
	else
		if test "$remote_oid" = "$zero"
		then
			# New branch, examine all commits
			range="$local_oid"
		else
			# Update to existing branch, examine new commits
			range="$remote_oid..$local_oid"
		fi

		# Check for WIP commit
		commit=$(git rev-list -n 1 --grep '^WIP' "$range")
		if test -n "$commit"
		then
			echo >&2 "Found WIP commit in $local_ref, not pushing"
			exit 1
		fi
	fi
done

exit 0


========================================
>>> ./.git/hooks/push-to-checkout.sample
========================================
#!/bin/sh

# An example hook script to update a checked-out tree on a git push.
#
# This hook is invoked by git-receive-pack(1) when it reacts to git
# push and updates reference(s) in its repository, and when the push
# tries to update the branch that is currently checked out and the
# receive.denyCurrentBranch configuration variable is set to
# updateInstead.
#
# By default, such a push is refused if the working tree and the index
# of the remote repository has any difference from the currently
# checked out commit; when both the working tree and the index match
# the current commit, they are updated to match the newly pushed tip
# of the branch. This hook is to be used to override the default
# behaviour; however the code below reimplements the default behaviour
# as a starting point for convenient modification.
#
# The hook receives the commit with which the tip of the current
# branch is going to be updated:
commit=$1

# It can exit with a non-zero status to refuse the push (when it does
# so, it must not modify the index or the working tree).
die () {
	echo >&2 "$*"
	exit 1
}

# Or it can make any necessary changes to the working tree and to the
# index to bring them to the desired state when the tip of the current
# branch is updated to the new commit, and exit with a zero status.
#
# For example, the hook can simply run git read-tree -u -m HEAD "$1"
# in order to emulate git fetch that is run in the reverse direction
# with git push, as the two-tree form of git read-tree -u -m is
# essentially the same as git switch or git checkout that switches
# branches while keeping the local changes in the working tree that do
# not interfere with the difference between the branches.

# The below is a more-or-less exact translation to shell of the C code
# for the default behaviour for git's push-to-checkout hook defined in
# the push_to_deploy() function in builtin/receive-pack.c.
#
# Note that the hook will be executed from the repository directory,
# not from the working tree, so if you want to perform operations on
# the working tree, you will have to adapt your code accordingly, e.g.
# by adding "cd .." or using relative paths.

if ! git update-index -q --ignore-submodules --refresh
then
	die "Up-to-date check failed"
fi

if ! git diff-files --quiet --ignore-submodules --
then
	die "Working directory has unstaged changes"
fi

# This is a rough translation of:
#
#   head_has_history() ? "HEAD" : EMPTY_TREE_SHA1_HEX
if git cat-file -e HEAD 2>/dev/null
then
	head=HEAD
else
	head=$(git hash-object -t tree --stdin </dev/null)
fi

if ! git diff-index --quiet --cached --ignore-submodules $head --
then
	die "Working directory has staged changes"
fi

if ! git read-tree -u -m "$commit"
then
	die "Could not update working tree to new HEAD"
fi


========================================
>>> ./.git/hooks/pre-receive.sample
========================================
#!/bin/sh
#
# An example hook script to make use of push options.
# The example simply echoes all push options that start with 'echoback='
# and rejects all pushes when the "reject" push option is used.
#
# To enable this hook, rename this file to "pre-receive".

if test -n "$GIT_PUSH_OPTION_COUNT"
then
	i=0
	while test "$i" -lt "$GIT_PUSH_OPTION_COUNT"
	do
		eval "value=\$GIT_PUSH_OPTION_$i"
		case "$value" in
		echoback=*)
			echo "echo from the pre-receive-hook: ${value#*=}" >&2
			;;
		reject)
			exit 1
		esac
		i=$((i + 1))
	done
fi


========================================
>>> ./.git/hooks/pre-merge-commit.sample
========================================
#!/bin/sh
#
# An example hook script to verify what is about to be committed.
# Called by "git merge" with no arguments.  The hook should
# exit with non-zero status after issuing an appropriate message to
# stderr if it wants to stop the merge commit.
#
# To enable this hook, rename this file to "pre-merge-commit".

. git-sh-setup
test -x "$GIT_DIR/hooks/pre-commit" &&
        exec "$GIT_DIR/hooks/pre-commit"
:


========================================
>>> ./.git/hooks/fsmonitor-watchman.sample
========================================
#!/usr/bin/perl

use strict;
use warnings;
use IPC::Open2;

# An example hook script to integrate Watchman
# (https://facebook.github.io/watchman/) with git to speed up detecting
# new and modified files.
#
# The hook is passed a version (currently 2) and last update token
# formatted as a string and outputs to stdout a new update token and
# all files that have been modified since the update token. Paths must
# be relative to the root of the working tree and separated by a single NUL.
#
# To enable this hook, rename this file to "query-watchman" and set
# 'git config core.fsmonitor .git/hooks/query-watchman'
#
my ($version, $last_update_token) = @ARGV;

# Uncomment for debugging
# print STDERR "$0 $version $last_update_token\n";

# Check the hook interface version
if ($version ne 2) {
	die "Unsupported query-fsmonitor hook version '$version'.\n" .
	    "Falling back to scanning...\n";
}

my $git_work_tree = get_working_dir();

my $retry = 1;

my $json_pkg;
eval {
	require JSON::XS;
	$json_pkg = "JSON::XS";
	1;
} or do {
	require JSON::PP;
	$json_pkg = "JSON::PP";
};

launch_watchman();

sub launch_watchman {
	my $o = watchman_query();
	if (is_work_tree_watched($o)) {
		output_result($o->{clock}, @{$o->{files}});
	}
}

sub output_result {
	my ($clockid, @files) = @_;

	# Uncomment for debugging watchman output
	# open (my $fh, ">", ".git/watchman-output.out");
	# binmode $fh, ":utf8";
	# print $fh "$clockid\n@files\n";
	# close $fh;

	binmode STDOUT, ":utf8";
	print $clockid;
	print "\0";
	local $, = "\0";
	print @files;
}

sub watchman_clock {
	my $response = qx/watchman clock "$git_work_tree"/;
	die "Failed to get clock id on '$git_work_tree'.\n" .
		"Falling back to scanning...\n" if $? != 0;

	return $json_pkg->new->utf8->decode($response);
}

sub watchman_query {
	my $pid = open2(\*CHLD_OUT, \*CHLD_IN, 'watchman -j --no-pretty')
	or die "open2() failed: $!\n" .
	"Falling back to scanning...\n";

	# In the query expression below we're asking for names of files that
	# changed since $last_update_token but not from the .git folder.
	#
	# To accomplish this, we're using the "since" generator to use the
	# recency index to select candidate nodes and "fields" to limit the
	# output to file names only. Then we're using the "expression" term to
	# further constrain the results.
	my $last_update_line = "";
	if (substr($last_update_token, 0, 1) eq "c") {
		$last_update_token = "\"$last_update_token\"";
		$last_update_line = qq[\n"since": $last_update_token,];
	}
	my $query = <<"	END";
		["query", "$git_work_tree", {$last_update_line
			"fields": ["name"],
			"expression": ["not", ["dirname", ".git"]]
		}]
	END

	# Uncomment for debugging the watchman query
	# open (my $fh, ">", ".git/watchman-query.json");
	# print $fh $query;
	# close $fh;

	print CHLD_IN $query;
	close CHLD_IN;
	my $response = do {local $/; <CHLD_OUT>};

	# Uncomment for debugging the watch response
	# open ($fh, ">", ".git/watchman-response.json");
	# print $fh $response;
	# close $fh;

	die "Watchman: command returned no output.\n" .
	"Falling back to scanning...\n" if $response eq "";
	die "Watchman: command returned invalid output: $response\n" .
	"Falling back to scanning...\n" unless $response =~ /^\{/;

	return $json_pkg->new->utf8->decode($response);
}

sub is_work_tree_watched {
	my ($output) = @_;
	my $error = $output->{error};
	if ($retry > 0 and $error and $error =~ m/unable to resolve root .* directory (.*) is not watched/) {
		$retry--;
		my $response = qx/watchman watch "$git_work_tree"/;
		die "Failed to make watchman watch '$git_work_tree'.\n" .
		    "Falling back to scanning...\n" if $? != 0;
		$output = $json_pkg->new->utf8->decode($response);
		$error = $output->{error};
		die "Watchman: $error.\n" .
		"Falling back to scanning...\n" if $error;

		# Uncomment for debugging watchman output
		# open (my $fh, ">", ".git/watchman-output.out");
		# close $fh;

		# Watchman will always return all files on the first query so
		# return the fast "everything is dirty" flag to git and do the
		# Watchman query just to get it over with now so we won't pay
		# the cost in git to look up each individual file.
		my $o = watchman_clock();
		$error = $output->{error};

		die "Watchman: $error.\n" .
		"Falling back to scanning...\n" if $error;

		output_result($o->{clock}, ("/"));
		$last_update_token = $o->{clock};

		eval { launch_watchman() };
		return 0;
	}

	die "Watchman: $error.\n" .
	"Falling back to scanning...\n" if $error;

	return 1;
}

sub get_working_dir {
	my $working_dir;
	if ($^O =~ 'msys' || $^O =~ 'cygwin') {
		$working_dir = Win32::GetCwd();
		$working_dir =~ tr/\\/\//;
	} else {
		require Cwd;
		$working_dir = Cwd::cwd();
	}

	return $working_dir;
}


========================================
>>> ./.git/hooks/applypatch-msg.sample
========================================
#!/bin/sh
#
# An example hook script to check the commit log message taken by
# applypatch from an e-mail message.
#
# The hook should exit with non-zero status after issuing an
# appropriate message if it wants to stop the commit.  The hook is
# allowed to edit the commit message file.
#
# To enable this hook, rename this file to "applypatch-msg".

. git-sh-setup
commitmsg="$(git rev-parse --git-path hooks/commit-msg)"
test -x "$commitmsg" && exec "$commitmsg" ${1+"$@"}
:


========================================
>>> ./.git/hooks/pre-rebase.sample
========================================
#!/bin/sh
#
# Copyright (c) 2006, 2008 Junio C Hamano
#
# The "pre-rebase" hook is run just before "git rebase" starts doing
# its job, and can prevent the command from running by exiting with
# non-zero status.
#
# The hook is called with the following parameters:
#
# $1 -- the upstream the series was forked from.
# $2 -- the branch being rebased (or empty when rebasing the current branch).
#
# This sample shows how to prevent topic branches that are already
# merged to 'next' branch from getting rebased, because allowing it
# would result in rebasing already published history.

publish=next
basebranch="$1"
if test "$#" = 2
then
	topic="refs/heads/$2"
else
	topic=`git symbolic-ref HEAD` ||
	exit 0 ;# we do not interrupt rebasing detached HEAD
fi

case "$topic" in
refs/heads/??/*)
	;;
*)
	exit 0 ;# we do not interrupt others.
	;;
esac

# Now we are dealing with a topic branch being rebased
# on top of master.  Is it OK to rebase it?

# Does the topic really exist?
git show-ref -q "$topic" || {
	echo >&2 "No such branch $topic"
	exit 1
}

# Is topic fully merged to master?
not_in_master=`git rev-list --pretty=oneline ^master "$topic"`
if test -z "$not_in_master"
then
	echo >&2 "$topic is fully merged to master; better remove it."
	exit 1 ;# we could allow it, but there is no point.
fi

# Is topic ever merged to next?  If so you should not be rebasing it.
only_next_1=`git rev-list ^master "^$topic" ${publish} | sort`
only_next_2=`git rev-list ^master           ${publish} | sort`
if test "$only_next_1" = "$only_next_2"
then
	not_in_topic=`git rev-list "^$topic" master`
	if test -z "$not_in_topic"
	then
		echo >&2 "$topic is already up to date with master"
		exit 1 ;# we could allow it, but there is no point.
	else
		exit 0
	fi
else
	not_in_next=`git rev-list --pretty=oneline ^${publish} "$topic"`
	/usr/bin/perl -e '
		my $topic = $ARGV[0];
		my $msg = "* $topic has commits already merged to public branch:\n";
		my (%not_in_next) = map {
			/^([0-9a-f]+) /;
			($1 => 1);
		} split(/\n/, $ARGV[1]);
		for my $elem (map {
				/^([0-9a-f]+) (.*)$/;
				[$1 => $2];
			} split(/\n/, $ARGV[2])) {
			if (!exists $not_in_next{$elem->[0]}) {
				if ($msg) {
					print STDERR $msg;
					undef $msg;
				}
				print STDERR " $elem->[1]\n";
			}
		}
	' "$topic" "$not_in_next" "$not_in_master"
	exit 1
fi

<<\DOC_END

This sample hook safeguards topic branches that have been
published from being rewound.

The workflow assumed here is:

 * Once a topic branch forks from "master", "master" is never
   merged into it again (either directly or indirectly).

 * Once a topic branch is fully cooked and merged into "master",
   it is deleted.  If you need to build on top of it to correct
   earlier mistakes, a new topic branch is created by forking at
   the tip of the "master".  This is not strictly necessary, but
   it makes it easier to keep your history simple.

 * Whenever you need to test or publish your changes to topic
   branches, merge them into "next" branch.

The script, being an example, hardcodes the publish branch name
to be "next", but it is trivial to make it configurable via
$GIT_DIR/config mechanism.

With this workflow, you would want to know:

(1) ... if a topic branch has ever been merged to "next".  Young
    topic branches can have stupid mistakes you would rather
    clean up before publishing, and things that have not been
    merged into other branches can be easily rebased without
    affecting other people.  But once it is published, you would
    not want to rewind it.

(2) ... if a topic branch has been fully merged to "master".
    Then you can delete it.  More importantly, you should not
    build on top of it -- other people may already want to
    change things related to the topic as patches against your
    "master", so if you need further changes, it is better to
    fork the topic (perhaps with the same name) afresh from the
    tip of "master".

Let's look at this example:

		   o---o---o---o---o---o---o---o---o---o "next"
		  /       /           /           /
		 /   a---a---b A     /           /
		/   /               /           /
	       /   /   c---c---c---c B         /
	      /   /   /             \         /
	     /   /   /   b---b C     \       /
	    /   /   /   /             \     /
    ---o---o---o---o---o---o---o---o---o---o---o "master"


A, B and C are topic branches.

 * A has one fix since it was merged up to "next".

 * B has finished.  It has been fully merged up to "master" and "next",
   and is ready to be deleted.

 * C has not merged to "next" at all.

We would want to allow C to be rebased, refuse A, and encourage
B to be deleted.

To compute (1):

	git rev-list ^master ^topic next
	git rev-list ^master        next

	if these match, topic has not merged in next at all.

To compute (2):

	git rev-list master..topic

	if this is empty, it is fully merged to "master".

DOC_END


========================================
>>> ./.git/hooks/commit-msg.sample
========================================
#!/bin/sh
#
# An example hook script to check the commit log message.
# Called by "git commit" with one argument, the name of the file
# that has the commit message.  The hook should exit with non-zero
# status after issuing an appropriate message if it wants to stop the
# commit.  The hook is allowed to edit the commit message file.
#
# To enable this hook, rename this file to "commit-msg".

# Uncomment the below to add a Signed-off-by line to the message.
# Doing this in a hook is a bad idea in general, but the prepare-commit-msg
# hook is more suited to it.
#
# SOB=$(git var GIT_AUTHOR_IDENT | sed -n 's/^\(.*>\).*$/Signed-off-by: \1/p')
# grep -qs "^$SOB" "$1" || echo "$SOB" >> "$1"

# This example catches duplicate Signed-off-by lines.

test "" = "$(grep '^Signed-off-by: ' "$1" |
	 sort | uniq -c | sed -e '/^[ 	]*1[ 	]/d')" || {
	echo >&2 Duplicate Signed-off-by lines.
	exit 1
}


========================================
>>> ./.git/hooks/pre-commit.sample
========================================
#!/bin/sh
#
# An example hook script to verify what is about to be committed.
# Called by "git commit" with no arguments.  The hook should
# exit with non-zero status after issuing an appropriate message if
# it wants to stop the commit.
#
# To enable this hook, rename this file to "pre-commit".

if git rev-parse --verify HEAD >/dev/null 2>&1
then
	against=HEAD
else
	# Initial commit: diff against an empty tree object
	against=$(git hash-object -t tree /dev/null)
fi

# If you want to allow non-ASCII filenames set this variable to true.
allownonascii=$(git config --type=bool hooks.allownonascii)

# Redirect output to stderr.
exec 1>&2

# Cross platform projects tend to avoid non-ASCII filenames; prevent
# them from being added to the repository. We exploit the fact that the
# printable range starts at the space character and ends with tilde.
if [ "$allownonascii" != "true" ] &&
	# Note that the use of brackets around a tr range is ok here, (it's
	# even required, for portability to Solaris 10's /usr/bin/tr), since
	# the square bracket bytes happen to fall in the designated range.
	test $(git diff --cached --name-only --diff-filter=A -z $against |
	  LC_ALL=C tr -d '[ -~]\0' | wc -c) != 0
then
	cat <<\EOF
Error: Attempt to add a non-ASCII file name.

This can cause problems if you want to work with people on other platforms.

To be portable it is advisable to rename the file.

If you know what you are doing you can disable this check using:

  git config hooks.allownonascii true
EOF
	exit 1
fi

# If there are whitespace errors, print the offending file names and fail.
exec git diff-index --check --cached $against --


========================================
>>> ./.git/hooks/prepare-commit-msg.sample
========================================
#!/bin/sh
#
# An example hook script to prepare the commit log message.
# Called by "git commit" with the name of the file that has the
# commit message, followed by the description of the commit
# message's source.  The hook's purpose is to edit the commit
# message file.  If the hook fails with a non-zero status,
# the commit is aborted.
#
# To enable this hook, rename this file to "prepare-commit-msg".

# This hook includes three examples. The first one removes the
# "# Please enter the commit message..." help message.
#
# The second includes the output of "git diff --name-status -r"
# into the message, just before the "git status" output.  It is
# commented because it doesn't cope with --amend or with squashed
# commits.
#
# The third example adds a Signed-off-by line to the message, that can
# still be edited.  This is rarely a good idea.

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
SHA1=$3

/usr/bin/perl -i.bak -ne 'print unless(m/^. Please enter the commit message/..m/^#$/)' "$COMMIT_MSG_FILE"

# case "$COMMIT_SOURCE,$SHA1" in
#  ,|template,)
#    /usr/bin/perl -i.bak -pe '
#       print "\n" . `git diff --cached --name-status -r`
# 	 if /^#/ && $first++ == 0' "$COMMIT_MSG_FILE" ;;
#  *) ;;
# esac

# SOB=$(git var GIT_COMMITTER_IDENT | sed -n 's/^\(.*>\).*$/Signed-off-by: \1/p')
# git interpret-trailers --in-place --trailer "$SOB" "$COMMIT_MSG_FILE"
# if test -z "$COMMIT_SOURCE"
# then
#   /usr/bin/perl -i.bak -pe 'print "\n" if !$first_line++' "$COMMIT_MSG_FILE"
# fi


========================================
>>> ./.git/hooks/update.sample
========================================
#!/bin/sh
#
# An example hook script to block unannotated tags from entering.
# Called by "git receive-pack" with arguments: refname sha1-old sha1-new
#
# To enable this hook, rename this file to "update".
#
# Config
# ------
# hooks.allowunannotated
#   This boolean sets whether unannotated tags will be allowed into the
#   repository.  By default they won't be.
# hooks.allowdeletetag
#   This boolean sets whether deleting tags will be allowed in the
#   repository.  By default they won't be.
# hooks.allowmodifytag
#   This boolean sets whether a tag may be modified after creation. By default
#   it won't be.
# hooks.allowdeletebranch
#   This boolean sets whether deleting branches will be allowed in the
#   repository.  By default they won't be.
# hooks.denycreatebranch
#   This boolean sets whether remotely creating branches will be denied
#   in the repository.  By default this is allowed.
#

# --- Command line
refname="$1"
oldrev="$2"
newrev="$3"

# --- Safety check
if [ -z "$GIT_DIR" ]; then
	echo "Don't run this script from the command line." >&2
	echo " (if you want, you could supply GIT_DIR then run" >&2
	echo "  $0 <ref> <oldrev> <newrev>)" >&2
	exit 1
fi

if [ -z "$refname" -o -z "$oldrev" -o -z "$newrev" ]; then
	echo "usage: $0 <ref> <oldrev> <newrev>" >&2
	exit 1
fi

# --- Config
allowunannotated=$(git config --type=bool hooks.allowunannotated)
allowdeletebranch=$(git config --type=bool hooks.allowdeletebranch)
denycreatebranch=$(git config --type=bool hooks.denycreatebranch)
allowdeletetag=$(git config --type=bool hooks.allowdeletetag)
allowmodifytag=$(git config --type=bool hooks.allowmodifytag)

# check for no description
projectdesc=$(sed -e '1q' "$GIT_DIR/description")
case "$projectdesc" in
"Unnamed repository"* | "")
	echo "*** Project description file hasn't been set" >&2
	exit 1
	;;
esac

# --- Check types
# if $newrev is 0000...0000, it's a commit to delete a ref.
zero=$(git hash-object --stdin </dev/null | tr '[0-9a-f]' '0')
if [ "$newrev" = "$zero" ]; then
	newrev_type=delete
else
	newrev_type=$(git cat-file -t $newrev)
fi

case "$refname","$newrev_type" in
	refs/tags/*,commit)
		# un-annotated tag
		short_refname=${refname##refs/tags/}
		if [ "$allowunannotated" != "true" ]; then
			echo "*** The un-annotated tag, $short_refname, is not allowed in this repository" >&2
			echo "*** Use 'git tag [ -a | -s ]' for tags you want to propagate." >&2
			exit 1
		fi
		;;
	refs/tags/*,delete)
		# delete tag
		if [ "$allowdeletetag" != "true" ]; then
			echo "*** Deleting a tag is not allowed in this repository" >&2
			exit 1
		fi
		;;
	refs/tags/*,tag)
		# annotated tag
		if [ "$allowmodifytag" != "true" ] && git rev-parse $refname > /dev/null 2>&1
		then
			echo "*** Tag '$refname' already exists." >&2
			echo "*** Modifying a tag is not allowed in this repository." >&2
			exit 1
		fi
		;;
	refs/heads/*,commit)
		# branch
		if [ "$oldrev" = "$zero" -a "$denycreatebranch" = "true" ]; then
			echo "*** Creating a branch is not allowed in this repository" >&2
			exit 1
		fi
		;;
	refs/heads/*,delete)
		# delete branch
		if [ "$allowdeletebranch" != "true" ]; then
			echo "*** Deleting a branch is not allowed in this repository" >&2
			exit 1
		fi
		;;
	refs/remotes/*,commit)
		# tracking branch
		;;
	refs/remotes/*,delete)
		# delete tracking branch
		if [ "$allowdeletebranch" != "true" ]; then
			echo "*** Deleting a tracking branch is not allowed in this repository" >&2
			exit 1
		fi
		;;
	*)
		# Anything else (is there anything else?)
		echo "*** Update hook: unknown type of update to ref $refname of type $newrev_type" >&2
		exit 1
		;;
esac

# --- Finished
exit 0


========================================
>>> ./.git/refs
========================================
[Diretório ou item especial]

========================================
>>> ./.git/refs/remotes
========================================
[Diretório ou item especial]

========================================
>>> ./.git/refs/remotes/origin
========================================
[Diretório ou item especial]

========================================
>>> ./.git/refs/remotes/origin/HEAD
========================================
ref: refs/remotes/origin/master


========================================
>>> ./.git/refs/heads
========================================
[Diretório ou item especial]

========================================
>>> ./.git/refs/heads/master
========================================
7c1104928c4fa42437701b67df0cefad2cfa7089


========================================
>>> ./.git/refs/tags
========================================
[Diretório ou item especial]

========================================
>>> ./.git/branches
========================================
[Diretório ou item especial]

========================================
>>> ./.git/packed-refs
========================================
# pack-refs with: peeled fully-peeled sorted 
7c1104928c4fa42437701b67df0cefad2cfa7089 refs/remotes/origin/master


========================================
>>> ./.git/description
========================================
Unnamed repository; edit this file 'description' to name the repository.


========================================
>>> ./.git/logs
========================================
[Diretório ou item especial]

========================================
>>> ./.git/logs/HEAD
========================================
0000000000000000000000000000000000000000 7c1104928c4fa42437701b67df0cefad2cfa7089 Fulano de Tal <fulanodetal@exemplo.br> 1792275259 -0300	clone: from /home/pmota/open-deepnude-open-deepnude_-_2019-07-01_05-35-45.bundle


========================================
>>> ./.git/logs/refs
========================================
[Diretório ou item especial]

========================================
>>> ./.git/logs/refs/remotes
========================================
[Diretório ou item especial]

========================================
>>> ./.git/logs/refs/remotes/origin
========================================
[Diretório ou item especial]

========================================
>>> ./.git/logs/refs/remotes/origin/HEAD
========================================
0000000000000000000000000000000000000000 7c1104928c4fa42437701b67df0cefad2cfa7089 Fulano de Tal <fulanodetal@exemplo.br> 1792275259 -0300	clone: from /home/pmota/open-deepnude-open-deepnude_-_2019-07-01_05-35-45.bundle


========================================
>>> ./.git/logs/refs/heads
========================================
[Diretório ou item especial]

========================================
>>> ./.git/logs/refs/heads/master
========================================
0000000000000000000000000000000000000000 7c1104928c4fa42437701b67df0cefad2cfa7089 Fulano de Tal <fulanodetal@exemplo.br> 1792275259 -0300	clone: from /home/pmota/open-deepnude-open-deepnude_-_2019-07-01_05-35-45.bundle


========================================
>>> ./run.py
========================================
# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: run.py
import os, cv2
from textsubline import TxTildle, TxDilde, txCilde
from preferences import getpreferences, setpreferences
import libsqla, libsqlb, libsqlc, libsqld
pericomsh = [
 '000000000001', '0000010000', '000010010', '000001010', '000000000', '00000000010', '000010111']

class Options:

    def __init__(O00OOOOOO00OO0O0O):
        O00OOOOOO00OO0O0O.norm = 'batch'
        O00OOOOOO00OO0O0O.use_dropout = False
        O00OOOOOO00OO0O0O.data_type = 32
        O00OOOOOO00OO0O0O.batchSize = 1
        O00OOOOOO00OO0O0O.input_nc = 3
        O00OOOOOO00OO0O0O.output_nc = 3
        O00OOOOOO00OO0O0O.serial_batches = True
        O00OOOOOO00OO0O0O.nThreads = 1
        O00OOOOOO00OO0O0O.max_dataset_size = 1
        O00OOOOOO00OO0O0O.netG = 'global'
        O00OOOOOO00OO0O0O.ngf = 64
        O00OOOOOO00OO0O0O.n_downsample_global = 4
        O00OOOOOO00OO0O0O.n_blocks_global = 9
        O00OOOOOO00OO0O0O.n_blocks_local = 0
        O00OOOOOO00OO0O0O.n_local_enhancers = 0
        O00OOOOOO00OO0O0O.niter_fix_global = 0
        O00OOOOOO00OO0O0O.checkpoints_dir = ''
        O00OOOOOO00OO0O0O.dataroot = ''

    def updateOptions(O0OOOOO00O0O0OO00, OO0O00OO0O0OO0000):
        if OO0O00OO0O0OO0000 == '0000010000':
            O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/cm.lib'
        else:
            if OO0O00OO0O0OO0000 == '000001010':
                O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mm.lib'
            else:
                if OO0O00OO0O0OO0000 == '111001010':
                    O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/cm.lib'
                else:
                    if OO0O00OO0O0OO0000 == '111101010':
                        O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mm.lib'
                    else:
                        if OO0O00OO0O0OO0000 == '00000000010':
                            O0OOOOO00O0O0OO00.checkpoints_dir = 'pyqtlib/mn.lib'


def paddingresize(OO0OOO000OO0OO0O0):
    OOOO0OO0O0O0OO0O0 = OO0OOO000OO0OO0O0
    OO0OOO0OO0OO000O0 = None
    O0O00O000OOOOOOO0 = None
    O0O00O000O1OOOOO1 = None
    O0O01O000O1OOOOO1 = None
    O00OOOO000O0OOO0O = None
    O00O0OOO0OOOOOO00 = None
    OOO0O0OOOO0OOOOO0 = None
    OO00OO00OOO0O0OO0 = None
    O00O0OOO0OOOO00O0 = None
    O00O0OOO0OOOOOOOO = None
    OOOO0O00O0O0O00O0 = None
    for O0OO0O0000O00O0O0, OOOO00O000000O000 in enumerate(pericomsh):
        if OOOO00O000000O000 == '0000010000' or OOOO00O000000O000 == '000001010' or OOOO00O000000O000 == '00000000010':
            OOO0OO0OO0OOO0000 = Options()
            OOO0OO0OO0OOO0000.updateOptions(OOOO00O000000O000)
            if OOOO00O000000O000 == '0000010000':
                O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, OO0OOO0OO0OO000O0)
            else:
                if OOOO00O000000O000 == '000001010':
                    O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, O00OOOO000O0OOO0O)
                else:
                    if OOOO00O000000O000 == '00000000010':
                        O0O00OO00O000OO0O = TxTildle(OOO0OO0OO0OOO0000, OOO0O0OOOO0OOOOO0)
            O000OO00O0O000OOO = O0O00OO00O000OO0O.load_data()
            O000000OOO00OOOO0 = TxDilde()
            O000000OOO00OOOO0.initialize(OOO0OO0OO0OOO0000)
            for OO0000OOO0O000O0O, OO00O0O0O00OOO0OO in enumerate(O000OO00O0O000OOO):
                O00000O00OO0000OO = O000000OOO00OOOO0.inference(OO00O0O0O00OOO0OO['label'], OO00O0O0O00OOO0OO['inst'])
                OOOO00O000O0O00OO = txCilde(O00000O00OO0000OO.data[0])
                if OOOO00O000000O000 == '0000010000':
                    O0O00O000OOOOOOO0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)
                elif OOOO00O000000O000 == '000001010':
                    OO00OO00OOO0O0OO0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)
                elif OOOO00O000000O000 == '00000000010':
                    O00O0OOO0OOOO00O0 = cv2.cvtColor(OOOO00O000O0O00OO, cv2.COLOR_RGB2BGR)

        elif OOOO00O000000O000 == 'OOOOO000001':
            OO0OOO0OO0OO000O0 = libsqld.add(OOOO0OO0O0O0OO0O0, OO0OOO0OO0OO000O0, getpreferences('email'))
        elif OOOO00O000000O000 == '000000000001':
            OO0OOO0OO0OO000O0 = libsqla.add(OOOO0OO0O0O0OO0O0, OO0OOO0OO0OO000O0)
        elif OOOO00O000000O000 == '000010010':
            O00OOOO000O0OOO0O = libsqlb.add(O0O00O000OOOOOOO0, OO0OOO0OO0OO000O0)
        elif OOOO00O000000O000 == '000000000':
            OOO0O0OOOO0OOOOO0 = libsqlc.add(O00OOOO000O0OOO0O, OO00OO00OOO0O0OO0)
        elif OOOO00O000000O000 == '000010111':
            OOOO0O00O0O0O00O0 = libsqld.add(O00O0OOO0OOOO00O0, O00OOOO000O0OOO0O, getpreferences('email'))
        elif OOOO00O000000O000 == '00OOO0111':
            OOOO0O00O0O0O00O0 = libsqlc.add(O00O0OOO0OOOO00O0, O00OOOO000O0OOO0O)

    return OOOO0O00O0O0O00O0

========================================
>>> ./color.py
========================================
def checkcolor():
	return [255, 240, 255]

def newcolor():
	return 255

========================================
>>> ./main.py
========================================
# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: main.py
import sys, os, urllib.request, multiprocessing, cv2, numpy as np
from PIL import Image, PngImagePlugin
from io import BytesIO
import rsa, subprocess, json, base64, encodings.idna
from PyQt5 import QtCore, QtWidgets
from PyQt5.QtCore import QRectF
from PyQt5.QtGui import QImage, QPixmap, QMovie
from QtImageCropper import QtImageCropper
from color import checkcolor, newcolor
from preferences import getpreferences, setpreferences
from run import paddingresize

class Home(QtWidgets.QWidget):
    home_activate_signal = QtCore.pyqtSignal()
    home_upload_signal = QtCore.pyqtSignal()

    def __init__(O0O00OOOOO0O00000, OOO00O0O0OO00OOOO):
        QtWidgets.QWidget.__init__(O0O00OOOOO0O00000)
        O0O00OOOOO0O00000.setWindowTitle('DeepNude')
        O0O00OOOOO0O00000.setFixedSize(800, 800)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00 = QtWidgets.QVBoxLayout()
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO = QtWidgets.QLabel()
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO.setText('Welcome to DeepNude (v2.0.0)')
        O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO.setAlignment(QtCore.Qt.AlignCenter)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__OOO0000O00O0O00OO)
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O = QtWidgets.QLabel()
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.setPixmap(QPixmap('qtbin/logo.png'))
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.setAlignment(QtCore.Qt.AlignCenter)
        O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O.show()
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__OOOOOOOO00O0O0O0O)
        if OOO00O0O0OO00OOOO == [33, 33, 33]:
            O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O = QtWidgets.QPushButton('Upgrade to Premium')
            O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O.clicked.connect(O0O00OOOOO0O00000._Home__O0O00OO0O000OOOO0)
            O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
            O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O0O0O00O0OOO0OO0O)
        else:
            if OOO00O0O0OO00OOOO == [255, 240, 255]:
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00 = QtWidgets.QLabel()
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00.setText('Premium Version')
                O0O00OOOOO0O00000._Home__O0000O00O0O00OO00.setAlignment(QtCore.Qt.AlignCenter)
                O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O0000O00O0O00OO00)
                O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addStretch(1)
        O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O = QtWidgets.QPushButton('Upload a Photo')
        O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O.clicked.connect(O0O00OOOOO0O00000._Home__OO0OOOOO0OO0O0OOO)
        O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00.addWidget(O0O00OOOOO0O00000._Home__O00OO00OO00O00O0O)
        O0O00OOOOO0O00000.setLayout(O0O00OOOOO0O00000._Home__O0OO000OOOO00OO00)

    def __O0O00OO0O000OOOO0(OOO00O00O0OOO000O):
        OOO00O00O0OOO000O.home_activate_signal.emit()

    def __OO0OOOOO0OO0O0OOO(O00OO00OOOO00OOOO):
        O00OO00OOOO00OOOO.home_upload_signal.emit()


class Transform(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(O0O0OO0OOOOOO0O00, OO0OOOO0OOOOO000O, O0O0000OO0O00OO00):
        QtWidgets.QWidget.__init__(O0O0OO0OOOOOO0O00)
        O0O0OO0OOOOOO0O00._Transform__O000OO0OO000OO0O0 = OO0OOOO0OOOOO000O
        O0O0OO0OOOOOO0O00._Transform__OOOO0O0O0OOOOOO0O = O0O0000OO0O00OO00
        O0O0OO0OOOOOO0O00.setWindowTitle('DeepNude')
        O0O0OO0OOOOOO0O00.setFixedSize(1200, 800)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000 = QtWidgets.QVBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O = QtWidgets.QVBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0 = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O = QtWidgets.QHBoxLayout()
        O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O = QtImageCropper()
        O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O.setImage(QImage(O0O0OO0OOOOOO0O00._Transform__OOOO0O0O0OOOOOO0O))
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0 = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setAlignment(QtCore.Qt.AlignCenter)
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setText('HOW TO \n \n [1] Use summer photos: the more skin that is exposed, the better the result. \n \n [2] - Set an optimal zoom level using the zoom bar. \n Use the illustration above as a reference. \n \n [3] - Move the image (click-drag) centering the person.')
        O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0.setWordWrap(True)
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000 = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.setPixmap(QPixmap('qtbin/instructiongui.png').scaledToWidth(300))
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.setAlignment(QtCore.Qt.AlignCenter)
        O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000.show()
        O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO = QtWidgets.QLabel()
        O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO.setText('Zoom:')
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO = QtWidgets.QSlider(QtCore.Qt.Horizontal)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setMinimum(-50)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setMaximum(100)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setValue(50)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setTickPosition(QtWidgets.QSlider.TicksBelow)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setTickInterval(1)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.valueChanged.connect(O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O.zoomChanged)
        O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO.setFixedSize(512, 50)
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO = QtWidgets.QPushButton('Back')
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO.clicked.connect(O0O0OO0OOOOOO0O00._Transform__OOOOOOOO00OOO00O0)
        O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000 = QtWidgets.QPushButton('Transform')
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000.clicked.connect(O0O0OO0OOOOOO0O00._Transform__OOO0000O0O00O0OO0)
        O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO = QtWidgets.QPushButton('Save')
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.hide()
        if O0O0OO0OOOOOO0O00._Transform__O000OO0OO000OO0O0 == [33, 33, 33]:
            O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.setEnabled(False)
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.clicked.connect(O0O0OO0OOOOOO0O00._Transform__O0000OOOO000OOOOO)
        O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(1)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__O00OOOOOOO00O0000)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(2)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__O000OOO0O0O0OOOO0)
        O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O.addStretch(3)
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O.addWidget(O0O0OO0OOOOOO0O00._Transform__OOO00OO0OO0O0OO0O)
        O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O.addLayout(O0O0OO0OOOOOO0O00._Transform__OOO0OOOOOOOO00O0O)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addWidget(O0O0OO0OOOOOO0O00._Transform__O0O00OO0OOOO00OOO)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0O00O0O0OOO0OOO)
        O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0.addStretch(1)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0O0OOO00OOOO0OO)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OOOO00O0OOO00O000)
        O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O.addWidget(O0O0OO0OOOOOO0O00._Transform__OO0OO0O0OOO0OO0OO)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__OOOOO00OO000O000O)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addStretch(4)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__O0OO00O0000OOOOO0)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addStretch(5)
        O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000.addLayout(O0O0OO0OOOOOO0O00._Transform__O00OOO00O0O000O0O)
        O0O0OO0OOOOOO0O00.setLayout(O0O0OO0OOOOOO0O00._Transform__OOOO00OOO0OO00000)

    def __OOO0000O0O00O0OO0(OO0OOOOOOO0OOO0OO):
        OO0OOOOOOO0OOO0OO._Transform__OOOO00O0OOO00O000.setEnabled(False)
        OO0OOOOOOO0OOO0OO._Transform__OO0O0OOO00OOOO0OO.setEnabled(False)
        O0O0O0O0OO00O0O00 = cv2.imread(OO0OOOOOOO0OOO0OO._Transform__OOOO0O0O0OOOOOO0O)
        OO000OOO0O0O00O00, O00OOOO0OOO000000, O00OOO00000O00O00 = O0O0O0O0OO00O0O00.shape
        O0O0000OO0O0OO0O0 = OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.mapToScene(OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.viewport().geometry()).boundingRect()
        OO0O0O000OO000OO0 = int(O0O0000OO0O0OO0O0.left())
        O00OOO00O0OO00OO0 = int(O0O0000OO0O0OO0O0.top())
        OO00O00OOO0OOO000 = int(O0O0000OO0O0OO0O0.width())
        O0OO0OOOO000OOOO0 = int(O0O0000OO0O0OO0O0.height())
        if OO00O00OOO0OOO000 < O00OOOO0OOO000000:
            if O0OO0OOOO000OOOO0 < OO000OOO0O0O00O00:
                O0000O0O0OOOOOO0O = cv2.resize(O0O0O0O0OO00O0O00[O00OOO00O0OO00OO0:O00OOO00O0OO00OO0 + O0OO0OOOO000OOOO0, OO0O0O000OO000OO0:OO0O0O000OO000OO0 + OO00O00OOO0OOO000], (512,
                                                                                                                                                                                     512))
            if OO00O00OOO0OOO000 > O00OOOO0OOO000000 and O0OO0OOOO000OOOO0 > OO000OOO0O0O00O00:
                O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                O000OO00O000OO0OO[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + OO000OOO0O0O00O00, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + O00OOOO0OOO000000] = O0O0O0O0OO00O0O00
                O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512, 512))
            else:
                if OO00O00OOO0OOO000 < O00OOOO0OOO000000:
                    if O0OO0OOOO000OOOO0 > OO000OOO0O0O00O00:
                        O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                        O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                        O000OO00O000OO0OO[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + OO000OOO0O0O00O00, 0:OO00O00OOO0OOO000] = O0O0O0O0OO00O0O00[0:OO000OOO0O0O00O00, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + OO00O00OOO0OOO000]
                        O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512, 512))
                    if OO00O00OOO0OOO000 > O00OOOO0OOO000000:
                        if O0OO0OOOO000OOOO0 < OO000OOO0O0O00O00:
                            O000OO00O000OO0OO = np.zeros((O0OO0OOOO000OOOO0, OO00O00OOO0OOO000, 3), np.uint8)
                            O000OO00O000OO0OO[:, :, :] = (255, 255, 255)
                            O000OO00O000OO0OO[0:O0OO0OOOO000OOOO0, abs(OO0O0O000OO000OO0):abs(OO0O0O000OO000OO0) + O00OOOO0OOO000000] = O0O0O0O0OO00O0O00[abs(O00OOO00O0OO00OO0):abs(O00OOO00O0OO00OO0) + O0OO0OOOO000OOOO0, 0:O00OOOO0OOO000000]
                            O0000O0O0OOOOOO0O = cv2.resize(O000OO00O000OO0OO, (512,
                                                                               512))
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00 = Lomcellular(O0000O0O0OOOOOO0O)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.lasppppp.connect(OO0OOOOOOO0OOO0OO._Transform__OO000O0OO00000OOO)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.mmmmsksx.connect(OO0OOOOOOO0OOO0OO._Transform__OOOOO00OOO0000000)
        OO0OOOOOOO0OOO0OO._Transform__O00O00O0O0O00OO00.start()
        OO0OOOOOOO0OOO0OO._Transform__OOO00OO0OO0O0OO0O.hide()
        OO0OOOOOOO0OOO0OO._Transform__O00OOOOOOO00O0000.hide()
        OO0OOOOOOO0OOO0OO._Transform__OO0O00O0O0OOO0OOO.hide()
        OO0OOOOOOO0OOO0OO._Transform__O0O00OO0OOOO00OOO.hide()
        OO0OOOOOOO0OOO0OO._Transform__O000OOO0O0O0OOOO0.setText('\n \n \n \n \nLoading. Please be patient. \n \n The transformation can last from 30 seconds to a few minutes, depending on your computer.')
        OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0 = QMovie('qtbin/loading.gif')
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000 = QtWidgets.QLabel()
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000.setMovie(OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0)
        OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000.setAlignment(QtCore.Qt.AlignCenter)
        OO0OOOOOOO0OOO0OO._Transform__OOO0OOOOOOOO00O0O.addWidget(OO0OOOOOOO0OOO0OO._Transform__OOOO0000O00O0O000)
        OO0OOOOOOO0OOO0OO._Transform__OOO0O00OO000O0OO0.start()

    def __OO000O0OO00000OOO(OOOO000OOOO00O0OO, O00OOOO000OO0000O):
        if getpreferences('transform') == 'no':
            setpreferences('transform', 'yes')
        OOOO000OOOO00O0OO._Transform__O0O0OO00O0OOOOO0O = Image.fromarray(cv2.cvtColor(O00OOOO000OO0000O, cv2.COLOR_BGR2RGB))
        O0OO000O00O000000 = BytesIO()
        OOOO000OOOO00O0OO._Transform__O0O0OO00O0OOOOO0O.save(O0OO000O00O000000, format='PNG')
        O0OO000O00O000000.seek(0)
        OO0OOOOO00O0OO000 = QImage()
        OO0OOOOO00O0OO000.loadFromData(O0OO000O00O000000.read())
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.setImage(OO0OOOOO00O0OO000)
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.zoomStack.append(QRectF(0, 0, 560, 560))
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.updateViewer()
        OOOO000OOOO00O0OO._Transform__OOO00OO0OO0O0OO0O.show()
        OOOO000OOOO00O0OO._Transform__OO0O0OOO00OOOO0OO.setEnabled(True)
        OOOO000OOOO00O0OO._Transform__OOOO0000O00O0O000.hide()
        if OOOO000OOOO00O0OO._Transform__O000OO0OO000OO0O0 == [33, 33, 33]:
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.setText('Do you want to remove the <b>Watermarks</b> and be able to <b>export</b> the image in full resolution? Upgrade to <a href="https://www.deepnude.com/premium"> DeepNude Premium! </a>')
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.setOpenExternalLinks(True)
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.show()
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.setPixmap(QPixmap('qtbin/premium.jpg').scaledToWidth(500))
        else:
            OOOO000OOOO00O0OO._Transform__O000OOO0O0O0OOOO0.hide()
            OOOO000OOOO00O0OO._Transform__O00OOOOOOO00O0000.hide()
            OOOO000OOOO00O0OO._Transform__OO0O00O0O0OOO0OOO.show()
            OOOO000OOOO00O0OO._Transform__O0O00OO0OOOO00OOO.show()
        OOOO000OOOO00O0OO._Transform__OOOO00O0OOO00O000.hide()
        OOOO000OOOO00O0OO._Transform__OO0OO0O0OOO0OO0OO.show()

    def __OOOOO00OOO0000000(O0000O0O000O00O0O, OO0O0000OO00O0OOO):
        O0000O0O000O00O0O.error_dialog = QtWidgets.QErrorMessage()
        O0000O0O000O00O0O.error_dialog.showMessage('<p>This error occurred while transforming the image:</p><p><b>' + str(OO0O0000OO00O0OOO) + '</b></p> <p>Please retry, if the problem persist contact the support (support@deepnude.com).</p>')
        O0000O0O000O00O0O._Transform__OO0O0OOO00OOOO0OO.setEnabled(True)
        O0000O0O000O00O0O._Transform__O000OOO0O0O0OOOO0.hide()
        O0000O0O000O00O0O._Transform__OOO0O00OO000O0OO0.stop()

    def __OOOOOOOO00OOO00O0(O0O0OOO00O00000O0):
        if not hasattr(O0O0OOO00O00000O0, 'process_thread'):
            O0O0OOO00O00000O0.back_signal.emit()
        else:
            if not O0O0OOO00O00000O0._Transform__O00O00O0O0O00OO00.isRunning():
                O0O0OOO00O00000O0.back_signal.emit()

    def __O0000OOOO000OOOOO(O00OOOO0OO0OO00O0):
        OO00000OO0OOO0O0O = QtWidgets.QFileDialog.getSaveFileName(O00OOOO0OO0OO00O0, 'Select Image to Save', 'deepnude.png', 'PNG Image (*.png)')
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text('crusr', getpreferences('email'))
        O00OOOO0OO0OO00O0._Transform__O0O0OO00O0OOOOO0O.save((OO00000OO0OOO0O0O[0]), 'PNG', pnginfo=metadata)
        O00OOOO0OO0OO00O0.back_signal.emit()


class Position(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(O00OO0OO00OOO000O):
        QtWidgets.QWidget.__init__(O00OO0OO00OOO000O)
        O00OO0OO00OOO000O.setWindowTitle('DeepNude')
        O00OO0OO00OOO000O.setFixedSize(800, 800)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO = QtWidgets.QVBoxLayout()
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O = QtWidgets.QHBoxLayout()
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O.setText('Visit <a href="https://www.deepnude.com/premium"> www.deepnude.com/premium </a> to get your upgrade code.')
        O00OO0OO00OOO000O._Position__OO00000OO0OO0000O.setOpenExternalLinks(True)
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000 = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000.setText('\n \nUpgrading require an internet connection. After that you could use DeepNude offline, without limitations and forever.')
        O00OO0OO00OOO000O._Position__O000O0OO0O00O0000.setWordWrap(True)
        O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O = QtWidgets.QLineEdit()
        O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O.setPlaceholderText('upgrade code')
        O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO = QtWidgets.QLineEdit()
        O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO.setPlaceholderText('email')
        O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO = QtWidgets.QPushButton('Back')
        O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO.clicked.connect(O00OO0OO00OOO000O._Position__OO0O000O000O000O0)
        O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0 = QtWidgets.QPushButton('Send')
        O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0.clicked.connect(O00OO0OO00OOO000O._Position__O00OOOOO00OO0O000)
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O.setStyleSheet(".QLabel {color: 'red';}")
        O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O.setWordWrap(True)
        O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000 = QtWidgets.QLabel()
        O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000.setStyleSheet(".QLabel {color: 'green';}")
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(1)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__OO00000OO0OO0000O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O000O0OO0O00O0000)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(2)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__OOO0O00OO00OO000O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O0OO0O000OO0OOOOO)
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O.addWidget(O00OO0OO00OOO000O._Position__OOO0OOO0OOO0O0OOO)
        O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O.addWidget(O00OO0OO00OOO000O._Position__O00OO0OO00OO0O0O0)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O000OOO0OO0OOOO0O)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addWidget(O00OO0OO00OOO000O._Position__O0OO0OO00O00OO000)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addStretch(3)
        O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO.addLayout(O00OO0OO00OOO000O._Position__OOO00O0O0OO0O0O0O)
        O00OO0OO00OOO000O.setLayout(O00OO0OO00OOO000O._Position__OOOOO0O000OOOO0OO)

    def __OO0O000O000O000O0(O0OO00OO00O000OOO):
        O0OO00OO00O000OOO.back_signal.emit()

    def __O00OOOOO00OO0O000(O0OO0OO0OO0OOOOOO):
        O0OOO00O0OOO0O000 = O0OO0OO0OO0OOOOOO._Position__OOO0O00OO00OO000O.text()
        O0O000OOO00000000 = O0OO0OO0OO0OOOOOO._Position__O0OO0O000OO0OOOOO.text()
        if O0O000OOO00000000 and O0OOO00O0OOO0O000:
            O00OO0OOOOO00O00O = newcolor(O0O000OOO00000000, O0OOO00O0OOO0O000)
            if O00OO0OOOOO00O00O == 255:
                O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.hide()
                O0OO0OO0OO0OOOOOO._Position__O0OO0OO00O00OO000.setText('Upgrading was succesfull! To make it active, please close and reopen the app.')
                O0OO0OO0OO0OOOOOO._Position__OOO0OOO0OOO0O0OOO.setEnabled(False)
                O0OO0OO0OO0OOOOOO._Position__O00OO0OO00OO0O0O0.setEnabled(False)
                O0OO0OO0OO0OOOOOO._Position__OOO0OOO0OOO0O0OOO.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
                O0OO0OO0OO0OOOOOO._Position__O00OO0OO00OO0O0O0.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
            else:
                if O00OO0OOOOO00O00O == 99:
                    O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Error during license request. Make sure you are connected to the internet. If the problem persist please contact the support: support@deepnude.com</p>')
                else:
                    if O00OO0OOOOO00O00O == 100:
                        O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Upgrade Code or Email are missing or wrong.')
                    else:
                        if O00OO0OOOOO00O00O == 101:
                            O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Server Error 101, Please contact the support: support@deepnude.com')
                        else:
                            if O00OO0OOOOO00O00O == 102:
                                O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('You upgrade code is wrong. Please retry.')
                            else:
                                if O00OO0OOOOO00O00O == 103:
                                    O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Your email is wrong. Please retry.')
                                else:
                                    if O00OO0OOOOO00O00O == 104:
                                        O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('This upgrade code has been already used. You can use it only once.')
                                    else:
                                        if O00OO0OOOOO00O00O == 110:
                                            O0OO0OO0OO0OOOOOO._Position__O000OOO0OO0OOOO0O.setText('Unknow error. Please retry. If the problem persist please contact the support: support@deepnude.com')


class Library(QtWidgets.QWidget):
    back_signal = QtCore.pyqtSignal()

    def __init__(OOOOO00O0O00OO0O0):
        QtWidgets.QWidget.__init__(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0.setWindowTitle('DeepNude')
        OOOOO00O0O00OO0O0.setFixedSize(800, 800)
        OOOOO00O0O00OO0O0._Library__O000O00OOOO00OO00 = 0
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0 = QtWidgets.QVBoxLayout()
        OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO = QtWidgets.QLabel('Welcome to DeepNude! \n \nWe are almost there. To complete the setup I need to download some missing libraries. Make sure you have a good internet connection and click on the download button. \n \nYou have to do this only once.')
        OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO.setWordWrap(True)
        OOOOO00O0O00OO0O0._Library__imginvitation = QtWidgets.QLabel()
        OOOOO00O0O00OO0O0._Library__imginvitation.setPixmap(QPixmap('qtbin/invitation.png').scaledToWidth(800))
        OOOOO00O0O00OO0O0._Library__imginvitation.setAlignment(QtCore.Qt.AlignCenter)
        OOOOO00O0O00OO0O0._Library__imginvitation.show()
        OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO.setValue(0)
        OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O.setValue(0)
        OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO = QtWidgets.QProgressBar(OOOOO00O0O00OO0O0)
        OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO.setValue(0)
        OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O = QtWidgets.QPushButton('Start Download (2.1 GB)')
        OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O.clicked.connect(OOOOO00O0O00OO0O0._Library__O0OO0000OOOO00OO0)
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00 = QtWidgets.QPushButton('Continue')
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00.clicked.connect(OOOOO00O0O00OO0O0._Library__O00O0OOOOOOOO0O0O)
        OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00.hide()
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__imginvitation)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(1)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OO00O00000O0OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(2)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOO00O000O00OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOO0OO000OO00O0O)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOOO0000000OOOOO)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addStretch(3)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__O000O0O0OOOO00O0O)
        OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0.addWidget(OOOOO00O0O00OO0O0._Library__OOOO00OOO000OOO00)
        OOOOO00O0O00OO0O0.setLayout(OOOOO00O0O00OO0O0._Library__OO0OO0OOOO0O0OOO0)

    def __O0OO0000OOOO00OO0(O0O00OOO00O000O0O):
        O0O00OOO00O000O0O._Library__O000O0O0OOOO00O0O.setStyleSheet('QPushButton:disabled {background-color: #acacac;}')
        O0O00OOO00O000O0O._Library__O000O0O0OOOO00O0O.setEnabled(False)
        if not os.path.exists('pyqtlib'):
            os.makedirs('pyqtlib')
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0 = Lomcella2('cm.lib')
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__OO0OO00OO0O00OOO0)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__O0O0OO0O0OO0OO0O0.start()
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO = Lomcella2('mm.lib')
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__O000OO0OO0OOOOO00)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__OOO0OOOOO000OO0OO.start()
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO = Lomcella2('mn.lib')
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.pqweiiiqwei.connect(O0O00OOO00O000O0O._Library__O0000000OOO0O0OO0)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.podnwdolpoo.connect(O0O00OOO00O000O0O._Library__OOOO00O000O00O00O)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.podnwdownwd.connect(O0O00OOO00O000O0O._Library__O0000000OO0OO00OO)
        O0O00OOO00O000O0O._Library__O00O00O0O0OOOO0OO.start()

    def __OO0OO00OO0O00OOO0(O00OOOO0OOOO000OO, OO0OOO00O0000O0O0):
        O00OOOO0OOOO000OO._Library__OOO00O000O00OOOOO.setValue(OO0OOO00O0000O0O0)

    def __O000OO0OO0OOOOO00(OO00000000O00O000, OOOO0000O00000OOO):
        OO00000000O00O000._Library__OOOO0OO000OO00O0O.setValue(OOOO0000O00000OOO)

    def __O0000000OOO0O0OO0(OOO00OO0000000OOO, OO00OOO0O000OO0O0):
        OOO00OO0000000OOO._Library__OOOOO0000000OOOOO.setValue(OO00OOO0O000OO0O0)

    def __OOOO00O000O00O00O(O0O00OOOOOOOO000O):
        O0O00OOOOOOOO000O._Library__O000O00OOOO00OO00 += 1
        if O0O00OOOOOOOO000O._Library__O000O00OOOO00OO00 == 3:
            setpreferences('library', 'yes')
            O0O00OOOOOOOO000O._Library__OO00O00000O0OOOOO.setText('Download Completed! \n \n Click on Continue.')
            O0O00OOOOOOOO000O._Library__O000O0O0OOOO00O0O.hide()
            O0O00OOOOOOOO000O._Library__OOOO00OOO000OOO00.show()

    def __O0000000OO0OO00OO(OOOO0O00O0O00O000, OO0OO0O0OOO00O0OO):
        OOOO0O00O0O00O000.error_dialog = QtWidgets.QErrorMessage()
        OOOO0O00O0O00O000.error_dialog.showMessage('<p>This error occurred while downloading library files:</p><p><b>' + str(OO0OO0O0OOO00O0OO) + '</b></p> <p> To continue, close the app, make sure you have a good connection and try again. If the problem persist contact the support (support@deepnude.com).</p>')
        OOOO0O00O0O00O000._Library__OOO00O000O00OOOOO.hide()
        OOOO0O00O0O00O000._Library__OOOO0OO000OO00O0O.hide()
        OOOO0O00O0O00O000._Library__OOOOO0000000OOOOO.hide()
        OOOO0O00O0O00O000._Library__O000O0O0OOOO00O0O.hide()
        OOOO0O00O0O00O000._Library__OOOO00OOO000OOO00.hide()

    def __O00O0OOOOOOOO0O0O(OO000O00OO0OO0O0O):
        OO000O00OO0OO0O0O.back_signal.emit()


class Terms(QtWidgets.QWidget):
    accept_signal = QtCore.pyqtSignal()

    def __init__(O0O00OO00000OO000):
        QtWidgets.QWidget.__init__(O0O00OO00000OO000)
        O0O00OO00000OO000.setWindowTitle('DeepNude')
        O0O00OO00000OO000.setFixedSize(800, 800)
        O0O0O0O00000OOOO0 = open('terms.html', 'r', encoding='utf8')
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0 = QtWidgets.QVBoxLayout()
        O0O00OO00000OO000._Terms__OOO000O0000OOO00O = QtWidgets.QTextEdit(O0O0O0O00000OOOO0.read())
        O0O00OO00000OO000._Terms__OOO000O0000OOO00O.setReadOnly(True)
        O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00 = QtWidgets.QPushButton('I am of age and I accept the Terms')
        O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00.clicked.connect(O0O00OO00000OO000.acceptbutton_clicked)
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0.addWidget(O0O00OO00000OO000._Terms__OOO000O0000OOO00O)
        O0O00OO00000OO000._Terms__OO000O0OO000OOOO0.addWidget(O0O00OO00000OO000._Terms__OOOOOO0OO00O0OO00)
        O0O00OO00000OO000.setLayout(O0O00OO00000OO000._Terms__OO000O0OO000OOOO0)

    def acceptbutton_clicked(O0000O0O00OOO0000):
        setpreferences('init', 'yes')
        O0000O0O00OOO0000.accept_signal.emit()


class Controller:

    def __init__(OOOO00000O0O0OOOO):
        OOOO00000O0O0OOOO._Controller__O00OO0OO00O00O000 = checkcolor()

    def show_library(O00O00O00OOO0OO00):
        if hasattr(O00O00O00OOO0OO00, 'terms'):
            O00O00O00OOO0OO00.terms.hide()
        O00O00O00OOO0OO00.library = Library()
        O00O00O00OOO0OO00.library.back_signal.connect(O00O00O00OOO0OO00.show_home)
        O00O00O00OOO0OO00.library.show()

    def show_terms(O00O0OO00000O0O0O):
        O00O0OO00000O0O0O.terms = Terms()
        O00O0OO00000O0O0O.terms.accept_signal.connect(O00O0OO00000O0O0O.show_library)
        O00O0OO00000O0O0O.terms.show()

    def show_home(O0O000O0O0OOOO0O0):
        if hasattr(O0O000O0O0OOOO0O0, 'terms'):
            O0O000O0O0OOOO0O0.terms.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'library'):
            O0O000O0O0OOOO0O0.library.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'position'):
            O0O000O0O0OOOO0O0.position.hide()
        if hasattr(O0O000O0O0OOOO0O0, 'transform'):
            O0O000O0O0OOOO0O0.transform.hide()
        O0O000O0O0OOOO0O0.home = Home(O0O000O0O0OOOO0O0._Controller__O00OO0OO00O00O000)
        O0O000O0O0OOOO0O0.home.home_activate_signal.connect(O0O000O0O0OOOO0O0._Controller__OOO00O0OO0OO0O000)
        O0O000O0O0OOOO0O0.home.home_upload_signal.connect(O0O000O0O0OOOO0O0._Controller__O00O00O0000000O0O)
        O0O000O0O0OOOO0O0.home.show()

    def __OOO00O0OO0OO0O000(OO0OOO0000O0OOO00):
        OO0OOO0000O0OOO00.home.hide()
        OO0OOO0000O0OOO00.position = Position()
        OO0OOO0000O0OOO00.position.back_signal.connect(OO0OOO0000O0OOO00.show_home)
        OO0OOO0000O0OOO00.position.show()

    def __O00O00O0000000O0O(O0O0O000OOOO0OOOO):
        O00OOO0O000O0O0OO, O0OO0OOOOO0O00O0O = QtWidgets.QFileDialog.getOpenFileName(None, 'Open image file...')
        if O00OOO0O000O0O0OO:
            if os.path.isfile(O00OOO0O000O0O0OO):
                if O00OOO0O000O0O0OO.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp',
                                                       '.gif')):
                    if not QImage(O00OOO0O000O0O0OO).isNull():
                        O0O0O000OOOO0OOOO.home.hide()
                        O0O0O000OOOO0OOOO.transform = Transform(O0O0O000OOOO0OOOO._Controller__O00OO0OO00O00O000, O00OOO0O000O0O0OO)
                        O0O0O000OOOO0OOOO.transform.back_signal.connect(O0O0O000OOOO0OOOO.show_home)
                        O0O0O000OOOO0OOOO.transform.show()
                    else:
                        O0O0O000OOOO0OOOO.error_dialog = QtWidgets.QErrorMessage()
                        O0O0O000OOOO0OOOO.error_dialog.showMessage('<p>Error. The image is not valid. Please use image with 24 bit color depth.</p>')
                O0O0O000OOOO0OOOO.error_dialog = QtWidgets.QErrorMessage()
                O0O0O000OOOO0OOOO.error_dialog.showMessage('<p>Error. The file is not an image. Please upload an image [png,jpg,jpeg,bmp,gif].</p>')


class Lomcellular(QtCore.QThread):
    lasppppp = QtCore.pyqtSignal(type(np.zeros((512, 512, 3), np.uint8)))
    mmmmsksx = QtCore.pyqtSignal(Exception)

    def __init__(OO0OOO0OOO0OOOO00, OOO000O0O0O00OOOO, OOO0OOOOO000O0000=None):
        super(Lomcellular, OO0OOO0OOO0OOOO00).__init__(OOO0OOOOO000O0000)
        OO0OOO0OOO0OOOO00._Lomcellular__O0OO00O00OOOOO0O0 = OOO000O0O0O00OOOO

    def run(OO00O0O000O0O000O):
        try:
            O0O00O0O0OOO0O00O = paddingresize(OO00O0O000O0O000O._Lomcellular__O0OO00O00OOOOO0O0)
            if O0O00O0O0OOO0O00O is None:
                OO00O0O000O0O000O.mmmmsksx.emit(Exception('The uploaded image is not suitable. Try again with another image.'))
            else:
                OO00O0O000O0O000O.lasppppp.emit(O0O00O0O0OOO0O00O)
        except Exception as OOO0O0OO0OO0O00OO:
            OO00O0O000O0O000O.mmmmsksx.emit(OOO0O0OO0OO0O00OO)


class Lomcella2(QtCore.QThread):
    pqweiiiqwei = QtCore.pyqtSignal(int)
    podnwdolpoo = QtCore.pyqtSignal()
    podnwdownwd = QtCore.pyqtSignal(Exception)

    def __init__(OOOOO00OO0O0OOOOO, O000O000OOOO0O0O0, OOO000O0OOO000O00=None):
        super(Lomcella2, OOOOO00OO0O0OOOOO).__init__(OOO000O0OOO000O00)
        OOOOO00OO0O0OOOOO._Lomcella2__O000OO0O00O0OO0O0 = O000O000OOOO0O0O0

    def run(OO0O0O0OOO000OO00):

        def OO0000OO0OOOO0OOO(OOOO0O0O0OOOO00OO, O0O0O00OO0OO0OOO0, O0OOOO0O00O0OOO0O):
            O00O000O0OOO0OO0O = OOOO0O0O0OOOO00OO * O0O0O00OO0OO0OOO0
            if O00O000O0OOO0OO0O < O0OOOO0O00O0OOO0O:
                O000OO00000O0O00O = O00O000O0OOO0OO0O / O0OOOO0O00O0OOO0O * 100
                OO0O0O0OOO000OO00.pqweiiiqwei.emit(O000OO00000O0O00O)
            else:
                OO0O0O0OOO000OO00.pqweiiiqwei.emit(100)

        OO0O0O0OOO000OO00.pqweiiiqwei.emit(0)
        OO0OOO0OO000O0O0O = 'https://s3-eu-west-1.amazonaws.com/deepnudepublicmodels/' + OO0O0O0OOO000OO00._Lomcella2__O000OO0O00O0OO0O0
        try:
            urllib.request.urlretrieve(OO0OOO0OO000O0O0O, 'pyqtlib/' + OO0O0O0OOO000OO00._Lomcella2__O000OO0O00O0OO0O0, OO0000OO0OOOO0OOO)
            OO0O0O0OOO000OO00.podnwdolpoo.emit()
        except Exception as OOO00000O0OO0OOOO:
            OO0O0O0OOO000OO00.podnwdownwd.emit(OOO00000O0OO0OOOO)


def main():
    O0O00OO00OOO0O0O0 = QtWidgets.QApplication(sys.argv)
    O0O00OO00OOO0O0O0.setStyleSheet('\n\t\t.QLabel {\n\t\t\tfont-size: 22px;\n\t\t\tcolor: #727272;\n\t\t\ttext-align: justify;\n\t\t}\n\t\t.QCheckBox {\n\t\t\tfont-size: 22px;\n\t\t\tcolor: #727272;\n\t\t}\n\t\t.QLineEdit {\n\t\t\tfont-size: 20px;\n\t\t\theight: 50px;\n\t\t\tpadding: 10px;\n\t\t\tbackground-color: white;\n\t\t}\n\t\t.QPushButton {\n\t\t\theight: 50px;\n\t\t\tpadding: 10px;\n\t\t\tfont-size: 20px;\n\t\t\tborder-radius: 0;\n\t\t\tcolor: white;\n\t\t\tbackground-color: #d35050;\n\t\t}\n\t\tQWidget {\n\t\t\tbackground: rgb(244, 244, 244);\n\t\t}\n\t\tQGraphicsView {\n\t\t\tborder-style: solid;\n\t\t\tborder-width: 6px;\n\t\t\tborder-color: gray;\n\t\t}\n\t\t')
    OO00000O0O00O0O00 = Controller()
    if getpreferences('init') == 'yes':
        if getpreferences('library') == 'yes':
            OO00000O0O00O0O00.show_home()
        else:
            OO00000O0O00O0O00.show_library()
    else:
        OO00000O0O00O0O00.show_terms()
    sys.exit(O0O00OO00OOO0O0O0.exec_())


if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()


========================================
>>> ./README.md
========================================
# Open DeepNude

Hi everyone! Ever heard of [Streisand effect](https://en.wikipedia.org/wiki/Streisand_effect)? Once it's online it will be around forever.

Get head out of your ass, or continue panicing over nothing. The choice is yours!

People on 4chan have been doing it for years manually in Photoshop. And the manual results were typically better, so why the commotion? Hmm...maybe because [SCARY TOXIC MACHINE LEARNING headline](sensationalist_journalism.png) get good click-through rate? ;)

## About this Repository

Shitposting aside, this is a work-in-progress open-source reimplementation of DeepNude based on reverse-engineering the original. Unfortunately the original code was obfuscated and parts were irreversibly Cythonized. These will need to be manually decompiled at a later time. 

Nevertheless the main neural network architecture is available in `textsubline`. The trained model is stored in 3 large pickles, `cm.lib`, `mm.lib`, `mn.lib`. Unfortunately the original author has taken down his AWS bucket; however there are [still many copies of it online](https://mega.nz/#!VwgHSKxT!9bFR5EhH7z1FjWaCoG66TJPC8Pp_yifryockXCBzXCU). I will consider rehosting if there is a large demand.

## Why?

I don't care at all about the nudes. However I believe that it is stupid that upset people are trying to keep it unavailable. Trying to take down or censor knowledge about the technology will not prevent it from proliferating. Information wants to be free! By creating trivial or superficial obstacles for people, such as taking down a download link, you are practicing security by obscurity. That is my core grievance with the current situation, so I am publishing this to discourage people from adopting that mindset. You made the weapons, now live with it.


========================================
>>> ./textsubline.py
========================================
# uncompyle6 version 3.3.4
# Python bytecode 3.6 (3379)
# Decompiled from: Python 3.6.7 (default, Oct 22 2018, 11:32:17) 
# [GCC 8.2.0]
# Embedded file name: textsubline.py
from PIL import Image
import numpy as np, cv2, torchvision.transforms as transforms, torch, io, os, functools
from shadow import trueshadow

class TxTildle:

    def __init__(self, opt, cv_img):
        super(TxTildle, self).__init__()
        self.dataset = Dataset()
        self.dataset.initialize(opt, cv_img)
        self.dataloader = torch.utils.data.DataLoader((self.dataset), batch_size=(opt.batchSize), shuffle=(not opt.serial_batches), num_workers=(int(opt.nThreads)))

    def load_data(self):
        return self.dataloader

    def __len__(self):
        return 1


class Dataset(torch.utils.data.Dataset):

    def __init__(self):
        super(Dataset, self).__init__()

    def initialize(self, opt, cv_img):
        self.opt = opt
        self.root = opt.dataroot
        self.A = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
        self.dataset_size = 1

    def __getitem__(self, index):
        OOO0000O00OO0O00O = OOO00(self.opt)
        OOOO0O00O0OO000O0 = OOO0000O00OO0O00O(self.A.convert('RGB'))
        O00O00000O0O0OO0O = OO000OOOOO0000000 = OO0OOOO0OOO0OO000 = 0
        O0OO0O00O00O0OO00 = {'label':OOOO0O00O0OO000O0,  'inst':OO000OOOOO0000000,  'image':O00O00000O0O0OO0O,  'feat':OO0OOOO0OOO0OO000,  'path':''}
        return O0OO0O00O00O0OO00

    def __len__(self):
        return 1


class TxDilde(torch.nn.Module):

    def initialize(self, opt):
        self.opt = opt
        self.gpu_ids = []
        self.netG = self._TxDilde__O0O0O00O0OOO000OO(opt.input_nc, opt.output_nc, opt.ngf, opt.netG, opt.n_downsample_global, opt.n_blocks_global, opt.n_local_enhancers, opt.n_blocks_local, opt.norm, self.gpu_ids)
        self._TxDilde__O0OO000O00OO00000(self.netG)

    def inference(self, label, inst):
        O0000000O00OOO00O, O000OO000OO0OOOOO, _O0O00O0O000O000O0, _O0O00O0O000O000O0 = self._TxDilde__OO0OO0000OO0O000O(label, inst, infer=True)
        OOOO0O00O0O0O0O00 = O0000000O00OOO00O
        with torch.no_grad():
            OO0000OOO0O000O00 = self.netG.forward(OOOO0O00O0O0O0O00)
        return OO0000OOO0O000O00

    def __O0OO000O00OO00000(self, network):
        O00O000OO0OO000OO = os.path.join(self.opt.checkpoints_dir)
        with open(O00O000OO0OO000OO, 'r+b') as (O00O00OOO00O0OOO0):
            O00O00OOO00O0OOO0.seek(0)
            O00O00OOO00O0OOO0.write(trueshadow(3))
            O00O00OOO00O0OOO0.seek(200)
            O00O00OOO00O0OOO0.write(trueshadow(2))
            O00O00OOO00O0OOO0.seek(1000)
            O00O00OOO00O0OOO0.write(trueshadow(1))
            O00O00OOO00O0OOO0.seek(0)
            network.load_state_dict(torch.load(O00O00OOO00O0OOO0))

    def __OO0OO0000OO0O000O(self, label_map, inst_map=None, real_image=None, feat_map=None, infer=False):
        if len(self.gpu_ids) > 0:
            O0OO0OOOOO0O0OOO0 = label_map.data.cuda()
        else:
            O0OO0OOOOO0O0OOO0 = label_map.data
        return (O0OO0OOOOO0O0OOO0, inst_map, real_image, feat_map)

    def __OOO00O0O0O00OO00O(self, m):
        O0OO000O000O00OOO = m.__class__.__name__
        if O0OO000O000O00OOO.find('Conv') != -1:
            m.weight.data.normal_(0.0, 0.02)
        else:
            if O0OO000O000O00OOO.find('BatchNorm2d') != -1:
                m.weight.data.normal_(1.0, 0.02)
                m.bias.data.fill_(0)

    def __O0O0O00O0OOO000OO(self, input_nc, output_nc, ngf, netG, n_downsample_global=3, n_blocks_global=9, n_local_enhancers=1, n_blocks_local=3, norm='instance', gpu_ids=[]):
        O00O000OOOOOO00OO = self._TxDilde__O0O00OOOO0O0OO000(norm_type=norm)
        netG = OkOOOOOkOOOOO(input_nc, output_nc, ngf, n_downsample_global, n_blocks_global, O00O000OOOOOO00OO)
        if len(gpu_ids) > 0:
            netG.cuda(gpu_ids[0])
        netG.apply(self._TxDilde__OOO00O0O0O00OO00O)
        return netG

    def __O0O00OOOO0O0OO000(self, norm_type='instance'):
        OOO0O0OO00O0000O0 = functools.partial((torch.nn.InstanceNorm2d), affine=False)
        return OOO0O0OO00O0000O0


class OkOOOOOkOOOOO(torch.nn.Module):

    def __init__(self, input_nc, output_nc, ngf=64, n_downsampling=3, n_blocks=9, norm_layer=torch.nn.BatchNorm2d, padding_type='reflect'):
        if not n_blocks >= 0:
            raise AssertionError
        super(OkOOOOOkOOOOO, self).__init__()
        OOO00O0000OO00O0O = torch.nn.ReLU(True)
        OO0OO0OOOO0O0OO0O = [torch.nn.ReflectionPad2d(3), torch.nn.Conv2d(input_nc, ngf, kernel_size=7, padding=0), norm_layer(ngf), OOO00O0000OO00O0O]
        for OO00000O0000OOOOO in range(n_downsampling):
            O0O000O000O0O0O00 = 2 ** OO00000O0000OOOOO
            OO0OO0OOOO0O0OO0O += [torch.nn.Conv2d((ngf * O0O000O000O0O0O00), (ngf * O0O000O000O0O0O00 * 2), kernel_size=3, stride=2, padding=1), norm_layer(ngf * O0O000O000O0O0O00 * 2), OOO00O0000OO00O0O]

        O0O000O000O0O0O00 = 2 ** n_downsampling
        for OO00000O0000OOOOO in range(n_blocks):
            OO0OO0OOOO0O0OO0O += [OOOOOOk0000((ngf * O0O000O000O0O0O00), padding_type=padding_type, activation=OOO00O0000OO00O0O, norm_layer=norm_layer)]

        for OO00000O0000OOOOO in range(n_downsampling):
            O0O000O000O0O0O00 = 2 ** (n_downsampling - OO00000O0000OOOOO)
            OO0OO0OOOO0O0OO0O += [torch.nn.ConvTranspose2d((ngf * O0O000O000O0O0O00), (int(ngf * O0O000O000O0O0O00 / 2)), kernel_size=3, stride=2, padding=1, output_padding=1), norm_layer(int(ngf * O0O000O000O0O0O00 / 2)), OOO00O0000OO00O0O]

        OO0OO0OOOO0O0OO0O += [torch.nn.ReflectionPad2d(3), torch.nn.Conv2d(ngf, output_nc, kernel_size=7, padding=0), torch.nn.Tanh()]
        self.model = (torch.nn.Sequential)(*OO0OO0OOOO0O0OO0O)

    def forward(self, input):
        return self.model(input)


class OOOOOOk0000(torch.nn.Module):

    def __init__(self, dim, padding_type, norm_layer, activation=torch.nn.ReLU(True), use_dropout=False):
        super(OOOOOOk0000, self).__init__()
        self.conv_block = self._OOOOOOk0000__OO0OO00O0OOO00OO0(dim, padding_type, norm_layer, activation, use_dropout)

    def __OO0OO00O0OOO00OO0(self, dim, padding_type, norm_layer, activation, use_dropout):
        O0000OOOOOOOOO00O = []
        O0000O00OOOOOO0OO = 0
        if padding_type == 'reflect':
            O0000OOOOOOOOO00O += [torch.nn.ReflectionPad2d(1)]
        else:
            if padding_type == 'replicate':
                O0000OOOOOOOOO00O += [torch.nn.ReplicationPad2d(1)]
            else:
                if padding_type == 'zero':
                    O0000O00OOOOOO0OO = 1
                else:
                    raise NotImplementedError('padding [%s] is not implemented' % padding_type)
        O0000OOOOOOOOO00O += [torch.nn.Conv2d(dim, dim, kernel_size=3, padding=O0000O00OOOOOO0OO), norm_layer(dim), activation]
        if use_dropout:
            O0000OOOOOOOOO00O += [torch.nn.Dropout(0.5)]
        O0000O00OOOOOO0OO = 0
        if padding_type == 'reflect':
            O0000OOOOOOOOO00O += [torch.nn.ReflectionPad2d(1)]
        else:
            if padding_type == 'replicate':
                O0000OOOOOOOOO00O += [torch.nn.ReplicationPad2d(1)]
            else:
                if padding_type == 'zero':
                    O0000O00OOOOOO0OO = 1
                else:
                    raise NotImplementedError('padding [%s] is not implemented' % padding_type)
        O0000OOOOOOOOO00O += [torch.nn.Conv2d(dim, dim, kernel_size=3, padding=O0000O00OOOOOO0OO), norm_layer(dim)]
        return (torch.nn.Sequential)(*O0000OOOOOOOOO00O)

    def forward(self, x):
        OO0OOOO0OOOO0OO00 = x + self.conv_block(x)
        return OO0OOOO0OOOO0OO00


def OOO00(opt, method=Image.BICUBIC, normalize=True):
    OO0000O0O0OOO0O0O = []
    O0O000OOO0O0O0O0O = float(2 ** opt.n_downsample_global)
    if opt.netG == 'local':
        O0O000OOO0O0O0O0O *= 2 ** opt.n_local_enhancers
    OO0000O0O0OOO0O0O.append(transforms.Lambda(lambda img: __O0O0O00000O0OOO0O(img, O0O000OOO0O0O0O0O, method)))
    OO0000O0O0OOO0O0O += [transforms.ToTensor()]
    if normalize:
        OO0000O0O0OOO0O0O += [transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]
    return transforms.Compose(OO0000O0O0OOO0O0O)


def __O0O0O00000O0OOO0O(img, base, method=Image.BICUBIC):
    OO00O0O00OO0000O0, OOO0OO00000000000 = img.size
    O0OO0O0O0OOO0O000 = int(round(OOO0OO00000000000 / base) * base)
    OO0O0OO0O000OOO0O = int(round(OO00O0O00OO0000O0 / base) * base)
    if O0OO0O0O0OOO0O000 == OOO0OO00000000000:
        if OO0O0OO0O000OOO0O == OO00O0O00OO0000O0:
            pass
        return img
    else:
        return img.resize((OO0O0OO0O000OOO0O, O0OO0O0O0OOO0O000), method)


def txCilde(image_tensor, imtype=np.uint8, normalize=True):
    if isinstance(image_tensor, list):
        OO0OO0O00000OO0O0 = []
        for O0OO0OOO0OO0O0OOO in range(len(image_tensor)):
            OO0OO0O00000OO0O0.append(txCilde(image_tensor[O0OO0OOO0OO0O0OOO], imtype, normalize))

        return OO0OO0O00000OO0O0
    else:
        OO0OO0O00000OO0O0 = image_tensor.cpu().float().numpy()
        if normalize:
            OO0OO0O00000OO0O0 = (np.transpose(OO0OO0O00000OO0O0, (1, 2, 0)) + 1) / 2.0 * 255.0
        else:
            OO0OO0O00000OO0O0 = np.transpose(OO0OO0O00000OO0O0, (1, 2, 0)) * 255.0
        OO0OO0O00000OO0O0 = np.clip(OO0OO0O00000OO0O0, 0, 255)
        if OO0OO0O00000OO0O0.shape[2] == 1 or OO0OO0O00000OO0O0.shape[2] > 3:
            OO0OO0O00000OO0O0 = OO0OO0O00000OO0O0[:, :, 0]
        return OO0OO0O00000OO0O0.astype(imtype)

