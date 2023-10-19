// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract CappedSet {
    struct Element {
        address addr;
        uint256 value;
    }

    uint256 public numElements;
    Element[] public elements;

    constructor(uint256 _numElements) {
        require(_numElements > 0, "_numElements must be > 0");
        numElements = _numElements;
    }

    /**
     * @dev insert address & value to the set of elements
     * If the set reached out the max size, will boot out the lowest value.
     *
     * @param _addr addr
     * @param _value val
     *
     * @return _newLowestAddress new lowest addr in the updated set of elements
     * @return _newLowestValue new lowest val in the updated set of elements
     * Will return 0 value if first element inserted
     */
    function insert(address _addr, uint256 _value) external returns (address _newLowestAddress, uint256 _newLowestValue) {
        if(elements.length == 0) {
            elements.push(Element(_addr, _value));
            /* return 0 value if first element inserted */
            return (address(0), 0);
        }

        if(elements.length == numElements) {
            (address lowestAddr,) = _getLowestElement();
            remove(lowestAddr);
        }

        /** Add new element */
        elements.push(Element(_addr, _value));

        /** find new lowest element */
        ( _newLowestAddress, _newLowestValue) = _getLowestElement();
    }

    /**
     * @dev update the new val in the element by specific _addr
     * Will revert if addr does not exist in the set of elements
     *
     * @param _addr addr value that will be updated
     * @param _newVal new val
     *
     * @return _newLowestAddress new lowest addr in the updated set of elements after update
     * @return _newLowestValue new lowest val in the updated set of elements after update
     */
    function update(address _addr, uint256 _newVal) external returns (address _newLowestAddress, uint256 _newLowestValue) {
        uint256 elementIndex = _findElementIndexByAddr(_addr);
        require(elementIndex != type(uint256).max, "element not found");

        elements[elementIndex].value = _newVal;

        /** find new lowest element */
        ( _newLowestAddress, _newLowestValue) = _getLowestElement();
    }

    /**
     * @dev remove specific element of the set
     * Will revert if addr does not exist in the set of elements
     *
     * @param _addr addr value to be removed
     *
     * @return _newLowestAddress new lowest addr in the updated set of elements after removal
     * @return _newLowestValue new lowest val in the updated set of elements after removal
     */
    function remove(address _addr) public returns (address _newLowestAddress, uint256 _newLowestValue) {
        uint256 elementIndex = _findElementIndexByAddr(_addr);
        require(elementIndex != type(uint256).max, "element not found");

        uint256 lastElementIndex = elements.length - 1;
        if(elementIndex != lastElementIndex) {
            /** move last elemnt to the removed index */
            elements[elementIndex] = elements[lastElementIndex];
        }

        /** empty the last index */
        elements.pop();

        /** find new lowest element */
        ( _newLowestAddress, _newLowestValue) = _getLowestElement();
    }

    /**
     * @dev get value of element by specific addr
     * Will revert if addr does not exist in the set of elements
     *
     * @param _addr addr value to be found
     *
     * @return val of the element
     */
    function getValue(address _addr) external view returns (uint256) {
        uint256 elementIndex = _findElementIndexByAddr(_addr);
        require(elementIndex != type(uint256).max, "element not found");

        return elements[elementIndex].value;
    }

    /**
     * @dev external function to get the element that has lowest val
     *
     * @return lowest addr
     * @return lowest value
     */
    function getLowestElement() external view returns(address, uint256) {
        return _getLowestElement();
    }

    /**
     * @dev external function to return index of elements by specific addr
     *
     * @param _addr addr value
     *
     * @return index of elements or max int if none of addr is found
     */
    function findElementIndexByAddr(address _addr) external view returns(uint256) {
        return _findElementIndexByAddr(_addr);
    }

    /**
     * @dev internal function to get the element that has lowest val
     *
     * @return lowest addr
     * @return lowest value
     */
    function _getLowestElement() internal view returns (address, uint256) {
        Element memory lowest = elements[0];
        for(uint256 i = 1; i < elements.length; i++) {
            if(elements[i].value < lowest.value) lowest = elements[i];
        }

        return (lowest.addr, lowest.value);
    }

    /**
     * @dev internal function to return index of elements by specific addr
     *
     * @param _addr addr value
     *
     * @return index of elements or max int if none of addr is found
     */
    function _findElementIndexByAddr(address _addr) internal view returns(uint256) {
        for(uint256 i = 0; i < elements.length; i++) {
            if(elements[i].addr == _addr) return i;
        }

        return type(uint256).max;
    }
}