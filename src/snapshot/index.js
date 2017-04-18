import { default as ContributionHunk } from '../contribution-hunk';

const Snapshot = class {
    constructor  (prevSnapshot = Snapshot.root(), data = null) {
        if (prevSnapshot === null) {
            this.prevSnapshot = null;
            this.tracker = [null];
            this.hunks = [];
        } else {
            this.prevSnapshot = prevSnapshot;
            this.tracker = prevSnapshot.tracker.slice(0);
            this.hunks = prevSnapshot.hunks.map(d => ContributionHunk.clone(d));
        }
        this.data = data;
    }

    static with (prevSnapshot, data) {
        return new Snapshot(prevSnapshot, data);
    }

    static root () {
        return new Snapshot(null);
    }

    isRoot () {
        return !this.prevSnapshot;
    }

    prev () {
        return this.prevSnapshot;
    }

    apply (command) {
        // @temp Only addition is implemented 
        this._applyAddition(command[2], command[3]);

        return this;
    }

    _applyRemove (start, change) {
        if (!change) {
            return this;
        }

        return this; 
    }
    
    _applyAddition (start, change) {
        let index,
            hunk,
            indexToHunk,
            end;

        if (!change) {
            return this;
        }

        if (this.tracker.length - 1 < start) {
            index = this.hunks.push(ContributionHunk.of(start, start + change - 1, this.data));
            this.tracker = this.tracker.concat(Array(change).fill(index - 1));
        } else {
            indexToHunk = this.tracker[start]; 
            hunk = this.hunks[indexToHunk];
            
            if(hunk.range[0] !== start) {
                end = hunk.range[1];
                hunk.updateRange(undefined, start - 1);
                
                this.hunks = this.hunks
                                .slice(0, indexToHunk + 1)
                                .concat(ContributionHunk.cloneWithRange(hunk, start, end))
                                .concat(this.hunks.slice(indexToHunk + 1));

                this.tracker = this.tracker
                                .slice(0, start)
                                .concat(this.tracker.slice(start).map(d => d + 1));

                indexToHunk++;
            }
            
            this.hunks = this.hunks
                    .slice(0, indexToHunk)
                    .concat(ContributionHunk.of(start, start + change - 1, this.data))
                    .concat(
                        this.hunks
                            .slice(indexToHunk)
                            .map((_hunk) => _hunk.shift(change))
                    );

            this.tracker = this.tracker
                .slice(0, start)
                .concat(Array(change).fill(indexToHunk))
                .concat(
                    this.tracker
                        .slice(start)
                        .map(d => d + 1)
                );
        }

        return this;
    }

    getMax () {
        return this.hunks[this.hunks.length - 1].range[1];
    }
};

export { Snapshot as default };
