import React from "react";
import { Modal, View, Dimensions, TouchableHighlight, StyleSheet, Platform, Image, Text, TouchableWithoutFeedback } from "react-native";
import ActionButton from "react-native-action-button";
import Orientation from "react-native-orientation";
import { AdvancedList } from "react-native-advanced-list";
import { TouchableOpacity } from "react-native-gesture-handler";
import * as _ from "lodash";
import TextSize from "react-native-text-size";
import { isIphoneX } from './ScreenUtil';

const screentHeight = Dimensions.get("screen").height;
console.log(screentHeight);
export default class AdvancedFullScreenList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
            rowHeight: 55,
            showFloatButton: true,
            rightHeader: [],
            leftHeader: {},
            data: [],
            sortKey: "",
            sortType: "",
            headerAlignCenter: false,
            availableWidth: 0
        };
    }
    componentDidMount () {
        this.calculateColumns();
        Orientation.lockToPortrait();
        Orientation.addOrientationListener(this._orientationDidChange);
    }
    calculateColumns () {
        let data = this.props.data;
        let columns = [];
        let leftHeader = {};
        let playerData = [];
        let findHasUnit = false;
        for (var i in data.cols) {
            if (data.cols[i].fixed) {
                leftHeader = {
                    colId: data.cols[i].colId,
                    label: data.cols[i].name,
                    textAlign: "left",
                    fixed: true,
                    sortable: false,
                    width: 100
                }
            } else if (data.cols[i].kpi) {
                if (data.cols[i].unit)
                    findHasUnit = true;
                columns.push({
                    colId: data.cols[i].colId,
                    label: data.cols[i].name,
                    unit: data.cols[i].unit,
                    sortable: true,
                    textAlign: "right",
                    width: 100
                });
            }
            if (data.cols[i].colId === "COMMENT") {
                columns.push({
                    colId: data.cols[i].colId,
                    label: data.cols[i].name,
                    unit: "",
                    sortable: false,
                    textAlign: "left",
                    width: 100
                });
            }
        }

        for (var j in data.rowsTable) {
            playerData.push(data.rowsTable[j]);
        }

        let newList = _.sortBy(playerData, function (o) {
            return parseInt(o.SHIRT_NUMBER, 10);
        });
        this.setState({
            headerAlignCenter: !findHasUnit,
            data: { "players": newList },
            rightHeader: columns,
            leftHeader
        }, () => this.measureTextSize());
    }
    measureTextSize () {
        let promiseList = [];
        var that = this;
        promiseList.push(new Promise(function (resolve, reject) {
            let fixedColumnList = [];
            let fixedKey = "";
            fixedKey = that.state.leftHeader.colId;
            for (var l in that.state.data.players) {
                fixedColumnList.push(that.state.data.players[l][fixedKey])
            }
            var longestValue = fixedColumnList.reduce(function (a, b) { return a.length > b.length ? a : b; });
            console.log("longestValue")
            console.log(longestValue)
            TextSize.measure({
                text: longestValue,
                fontFamily: undefined,
                fontSize: 16
            }).then((size) => {
                resolve(size);
            }).catch((err) => {
                reject(err);
            });
        }))
        for (var i in this.state.rightHeader) {
            let columnName = this.state.rightHeader[i];
            promiseList.push(new Promise(function (resolve, reject) {
                TextSize.measure({
                    text: columnName.label,
                    fontFamily: undefined,
                    fontSize: 16
                }).then((size) => {
                    resolve(size);
                }).catch((err) => {
                    reject(err);
                });
            }));
        }
        Promise.all(promiseList).then(function (values) {
            //console.log(values);
            let newRightHeader = [];
            let fixedColumn = {
                colId: that.state.leftHeader.colId,
                label: that.state.leftHeader.label,
                sortable: that.state.leftHeader.sortable,
                textAlign: that.state.leftHeader.textAlign ? that.state.leftHeader.textAlign : "left",
                fixed: that.state.leftHeader.fixed,
                width: values[0].width + 10
            }
            for (var j in that.state.rightHeader) {
                let column = {
                    colId: that.state.rightHeader[j].colId,
                    label: that.state.rightHeader[j].label,
                    unit: that.state.rightHeader[j].unit,
                    sortable: that.state.rightHeader[j].sortable,
                    textAlign: that.state.rightHeader[j].textAlign ? that.state.rightHeader[j].textAlign : "left",
                    width: values[parseInt(j, 10) + 1].width + 10
                };
                newRightHeader.push(column);
            }
            let marginLeft = Platform.OS === "ios" ? (isIphoneX() ? 34 : 0) : 0;
            let marginRight = Platform.OS === "ios" ? (isIphoneX() ? 34 : 0) : 0;
            let tableWidth = screentHeight - marginLeft - marginRight - 18 - 18;
            let availableWidth = tableWidth - 100;
            for (var k in newRightHeader) {
                if (newRightHeader[k].colId !== "COMMENT")
                    availableWidth -= newRightHeader[k].width + 18
                else {
                    newRightHeader[k].width = availableWidth > newRightHeader[k].width ? availableWidth : newRightHeader[k].width
                }
            }
            that.setState({
                rightHeader: newRightHeader,
                leftHeader: fixedColumn
            });
        }).catch((err) => {
            console.log(err);
        });
    }
    componentWillUnmount () {
        // Remember to remove listener
        Orientation.removeOrientationListener(this._orientationDidChange);
    }
    _orientationDidChange = (orientation) => {
        if (orientation === "LANDSCAPE") {
            // do something with landscape layout
        } else {
            // do something with portrait layout
        }
    }
    _favLeftView (player, idx) {
        let bgColor = idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
        return (
            <TouchableHighlight
                key={this.randomStringId(10)}>
                <View style={{ height: this.state.rowHeight, paddingLeft: 18, justifyContent: "center", alignItems: "flex-start", backgroundColor: bgColor }}>
                    <Text style={[styles.text, { textAlign: "left", width: this.state.leftHeader.width }]}>
                        {player.COLUMN_FIXED}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }
    randomStringId (n) {
        let str = "abcdefghijklmnopqrstuvwxyz9876543210";
        let tmp = "",
            i = 0,
            l = str.length;
        for (i = 0; i < n; i++) {
            tmp += str.charAt(Math.floor(Math.random() * l));
        }
        return tmp;
    }
    _favRightView (player, idx) {
        let bgColor = idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
        let rowItems = [];
        for (var i in this.state.rightHeader) {
            let columnKey = this.state.rightHeader[i].colId;
            let textAlign = this.state.rightHeader[i].textAlign;
            let width = this.state.rightHeader[i].width;
            rowItems.push(<View key={this.randomStringId(10)} style={{ flexDirection: "row", paddingRight: 18 }}><Text style={[styles.text, { width, textAlign }]} >{player[columnKey]}</Text></View>);
        }
        return (
            <TouchableHighlight
                key={this.randomStringId(10)}>
                <View
                    style={{ flexDirection: "row", height: this.state.rowHeight, alignItems: "center", backgroundColor: bgColor }}>
                    {rowItems}
                </View>
            </TouchableHighlight>
        );
    }
    sortColumnData (colId) {
        let sortType = "desc";
        let sortKey = colId;
        if (this.state.sortKey === colId) {
            sortType = this.state.sortType === "desc" ? "asc" : "";
            sortKey = this.state.sortType === "desc" ? colId : "";
            this.setState({
                sortKey,
                sortType
            });
        } else {
            this.setState({
                sortKey: colId,
                sortType: "desc"
            });
        }
        let newList = _.sortBy(this.state.data.players, function (o) {
            return (sortKey === "") ? parseInt(o.SHIRT_NUMBER, 10) : (sortType === "asc") ? parseFloat(o[colId], 10) : -parseFloat(o[colId], 10);
        });
        /*let newList = _.orderBy(this.state.data.players, function (o) {
            return [sortKey === "" ? parseFloat(o.PLAYER_NUMBER) : parseFloat(o[colId])];
        }, [sortKey === "" ? "asc" : sortType]);*/
        //let data = Object.assign({}, this.state.data, { players: newList });
        //console.log(newList);
        //console.log(sortKey + ":" + sortType);
        this.setState({
            data: { players: newList }
        });
    }
    renderSortableColumn (item) {
        return (
            <TouchableWithoutFeedback key={this.randomStringId(10)} onPress={() => this.sortColumnData(item.colId)} activeOpacity={0.8}>
                <View style={{ width: item.width + 18, height: 40, flexDirection: "column", justifyContent: "center" }}>
                    <View style={{ flexDirection: "row", paddingRight: 18 }}>
                        <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
                            <Text
                                style={[styles.headerText, { width: item.width - 13, marginLeft: 0, marginRight: 6 }]}>
                                {item.label}
                            </Text>
                            {!this.state.headerAlignCenter ? <Text
                                style={[styles.headerUnitText, { marginLeft: 0, marginRight: 6 }]}>
                                {item.unit}
                            </Text> : null}
                        </View>
                        {(this.state.sortType === "desc" && this.state.sortKey === item.colId) ? <Image source={require("../img/order_descending.png")} style={{ width: 7, height: 14 }} /> : (this.state.sortType === "asc" && this.state.sortKey === item.colId ? <Image source={require("../img/order_ascending.png")} style={{ width: 7, height: 14 }} /> : <Image source={require("../img/order_default.png")} style={{ width: 7, height: 14 }} />)}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        )
    }
    renderFixedColumn (item) {
        return (<View style={{ flexDirection: "row", paddingRight: 18 }}>
            <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
                <Text
                    style={[styles.headerText, { width: item.width, marginLeft: 0, marginRight: 0, textAlign: item.textAlign }]}>
                    {item.label}
                </Text>
                {item.unit ? <Text
                    style={[styles.headerUnitText, { marginLeft: 0, marginRight: 0 }]}>
                    {item.unit}
                </Text> : null}
            </View>
        </View>)
    }
    _favHeader () {
        return (
            this.state.rightHeader.map((item) => (
                item.sortable ? this.renderSortableColumn(item) : this.renderFixedColumn(item)
            )
            ))
    }
    setModalVisible (visible) {
        this.setState({ modalVisible: visible });
    }
    showTable () {
        this.setModalVisible(true);
        if (Platform.OS === "ios") { Orientation.lockToLandscapeRight(); }
        else { Orientation.lockToLandscapeLeft(); }
    }
    hideTable () {
        this.props.hideTable && this.props.hideTable();
        Orientation.getOrientation((err, orientation) => {
            Orientation.lockToPortrait();
        });
    }
    renderFloatButton () {
        let marginRight = Platform.OS === "ios" ? (isIphoneX() ? 58 : 24) : 24;
        return this.state.showFloatButton ? <ActionButton onPress={() => this.hideTable()} buttonColor={"rgba(0, 0, 0, 0)"} offsetX={marginRight} hideShadow={true} size={60} renderIcon={() => { return <Image source={require("../img/test_result_back.png")} style={{ height: 60, width: 60 }} />; }} /> : null;
    }
    showHideFloatButton (isScrolling) {
        this.setState({
            showFloatButton: !isScrolling
        });
    }
    render () {
        return (
            <Modal
                animationType="fade"
                transparent={false}
                supportedOrientations={["landscape-right", "landscape-left", "portrait"]}
                visible={this.props.isVisible}
                onRequestClose={() => {
                    this.hideTable()
                }}
            >
                <AdvancedList
                    //isScrolling={(isScrolling) => this.showHideFloatButton(isScrolling)}
                    leftList={{
                        listHeader: () => {
                            return <View style={[styles.headerBar, { justifyContent: "center", paddingLeft: 18 }]}>
                                <Text style={[styles.headerText, { textAlign: "left", width: this.state.leftHeader.width }]}>{this.state.leftHeader.label}</Text>
                            </View>;
                        },
                        sectionHeader: (section, sectionIndex) => {
                            return <View />;
                        },
                        renderItem: (section, sectionIndex, item, itemIndex) => {
                            return this._favLeftView(item, itemIndex);
                        },
                        sections: [
                            { data: this.state.data.players }
                        ]
                    }}
                    rightList={{
                        listHeader: () => {
                            return <View style={[styles.headerBar, { flexDirection: "row", alignItems: "center" }]}>
                                {this._favHeader()}
                            </View>;
                        },
                        sectionHeader: (section, sectionIndex) => {
                            return <View />;
                        },
                        renderItem: (section, sectionIndex, item, itemIndex) => {
                            // console.log("renderLeftItem " + section.data.length + "-" + sectionIndex + "-" + item.favCode + "-" + itemIndex)
                            return this._favRightView(item, itemIndex);
                        },
                        sections: [
                            { data: this.state.data.players }
                        ],
                        contentContainerWidth: 100
                    }}
                />
                {this.renderFloatButton()}
            </Modal>
        );
    }
}
const styles = StyleSheet.create(
    {
        headerBar: {
            backgroundColor: "#F6F7F8",
            height: 40
        },
        text: {
            fontSize: 16,
            width: 100,
            textAlign: "right",
            color: "#232426",
            fontWeight: "bold"
        },
        headerUnitText: {
            fontSize: 8,
            lineHeight: 14,
            color: "#9F9F9F",
            textAlign: "right"
        },
        headerText: {
            width: 100,
            fontSize: 12,
            color: "#595B5F",
            textAlign: "right"
        },
        sectionView: {
            height: 30,
            justifyContent: "center",
            backgroundColor: "#F8F9F8"
        },
        actionButtonIcon: {
            fontSize: 20,
            height: 22,
            color: "white",
        }
    }
);
