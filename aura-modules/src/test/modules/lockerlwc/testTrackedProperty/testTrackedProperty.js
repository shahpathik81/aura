import { LightningElement, api, track } from 'lwc';
import * as testUtil from 'securemoduletest/testUtil';

export default class TrackedProperty extends LightningElement {
    @track title = 'Literal title';
    @track state = {
        title: 'Object key title',
        headings: {
            item1: 'Nested title'
        }
    }
    dirty = false;
    @api
    modify() {
        const prefix = '[Updated]'
        this.title = prefix.concat(this.title);
        this.state.title = prefix.concat(this.state.title);
        this.state.headings.item1 = prefix.concat(this.state.headings.item1);
        this.dirty = true;
    }

    @api
    reassign() {
        this.title = '[Updated]Literal title';
        this.state = {
            title: '[Updated]Object key title',
            headings: {
                item1: '[Updated]Nested title'
            }
        };
        this.dirty = true;
    }

    @api
    assertInitialState() {
        this.verifyTrackedPropertyValueInDom({
            literal: 'Literal title',
            objectProp: 'Object key title',
            nestedObjectProp: 'Nested title'
        });
    }

    @api
    assertUpdatedState() {
        const promise = testUtil.waitForPromise(
            false,
            () => {
                return this.dirty;
            },
            'Component was not rerendered'
        );

        promise.then(() => {
            this.verifyTrackedPropertyValueInDom({
            literal: '[Updated]Literal title',
            objectProp: '[Updated]Object key title',
            nestedObjectProp: '[Updated]Nested title'
            })
        });
        return promise;
    }

    verifyTrackedPropertyValueInDom(expectedValues) {
        const literalProp = this.template.querySelector('[id^="literal"]').innerText;
        const objectProp = this.template.querySelector('[id^="object_prop"]').innerText;
        const nestedObjectProp = this.template.querySelector('[id^="nested_prop"]').innerText;
        testUtil.assertEquals(expectedValues.literal, literalProp);
        testUtil.assertEquals(expectedValues.objectProp, objectProp);
        testUtil.assertEquals(expectedValues.nestedObjectProp, nestedObjectProp);
    }

    @api
    assertTrackedDataSetOnSecureChildPropertyIsReadOnly() {
        this.verifyDataSetOnChildPropertyIsReadOnly('[id^="crossNamespaceSecureChild"]');
    }

    @api
    assertTrackedDataSetOnUnsecureChildPropertyIsReadOnly() {
        this.verifyDataSetOnChildPropertyIsReadOnly('[id^="unsecureChild"]');
    }

    verifyDataSetOnChildPropertyIsReadOnly(childId) {
        const child = this.template.querySelector(childId);
        child.valueFromParent = this.state;
        child.verifyPublicPropertyDataIsReadOnly();
    }

    @api
    assertTrackedDataSetOnSecureGrandChildPropertyIsReadOnly() {
        const child = this.template.querySelector('[id^="crossNamespaceSecureChild"]');
        child.valueFromParent = this.state;
        child.verifyPublicPropertyDataIsReadOnlyInGrandChild();
    }

    @api
    assertTrackedDataSetOnSecureChildIsLive() {
        this.verifyDataSetOnChildIsLive('[id^="crossNamespaceSecureChild"]');
    }

    @api
    assertTrackedDataSetOnUnsecureChildIsLive() {
        this.verifyDataSetOnChildIsLive('[id^="unsecureChild"]');
    }

    verifyDataSetOnChildIsLive(childId) {
        const child = this.template.querySelector(childId);
        child.valueFromParent = this.state;
        const expected = '[Updated]Object key title';
        this.state.title = expected;
        child.verifyPublicPropertyDataIsLive('title', expected);
    }

    /**
     * Verify that reactive proxy sent to secure cross namespace child via public method retains its reactive nature
     */
    @api
    assertTrackedDataSentToSecureChildMethodIsLive() {
        return this.verifyDataSentToChildMethodIsLive('[id^="crossNamespaceSecureChild"]');
    }
    /**
     * Verify that reactive proxy sent to non-lockerized child via public method retains its reactive nature
     */
    @api
    assertTrackedDataSentToUnsecureChildMethodIsLive() {
        return this.verifyDataSentToChildMethodIsLive('[id^="unsecureChild"]');
    }

    verifyDataSentToChildMethodIsLive(childId) {
        const child = this.template.querySelector(childId);
        const returnValue = child.receiveDataAndMutateValue(this.state);
        testUtil.assertEquals(this.state, returnValue);
        // Mark that value is mutated in child
        this.dirty = true;
        const promise = testUtil.waitForPromise(
            false,
            () => {
                return this.dirty;
            },
            'Component was not rerendered'
        );

        promise.then(() => {
            this.verifyTrackedPropertyValueInDom({
                literal: 'Literal title',
                objectProp: '[Updated by child]Object key title',
                nestedObjectProp: '[Updated by child]Nested title'
            });
        });
        return promise;
    }

    @api
    assertTrackedDataSentToSecureGrandChildMethodIsLive() {
        const child = this.template.querySelector('[id^="crossNamespaceSecureChild"]');
        const returnValue = child.receiveDataAndMutateValueInGrandChild(this.state);
        testUtil.assertEquals(this.state, returnValue);
        // Mark that value is mutated in grand child
        this.dirty = true;
        const promise = testUtil.waitForPromise(
            false,
            () => {
                return this.dirty;
            },
            'Component was not rerendered'
        );

        promise.then(() => {
            this.verifyTrackedPropertyValueInDom({
                literal: 'Literal title',
                objectProp: '[Updated by grand child]Object key title',
                nestedObjectProp: '[Updated by grand child]Nested title'
            });
        })
        return promise;
    }

    renderedCallback() {
        this.dirty = false;
    }
}