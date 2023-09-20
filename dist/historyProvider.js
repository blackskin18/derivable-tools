"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolutionToPeriod = void 0;
const helper_1 = require("./utils/helper");
const constant_1 = require("./utils/constant");
const node_fetch_1 = __importDefault(require("node-fetch"));
const history = {};
const convertResolution = (oldResolution) => {
    if (oldResolution.includes('D')) {
        return oldResolution;
    }
    else {
        if (Number(oldResolution) < 60) {
            return oldResolution;
        }
        else {
            return Number(oldResolution) / 60 + 'H';
        }
    }
};
exports.resolutionToPeriod = {
    5: '5m',
    15: '15m',
    60: '1h',
    240: '4h',
    '1D': '1d',
};
exports.default = {
    history: history,
    getBars: function ({ route, resolution, inputToken, outputToken, limit, chainId, to, barValueType }) {
        const q = route.split('/').join(',');
        const url = `${constant_1.CHART_API_ENDPOINT[chainId]}candleline4?q=${q}&r=${convertResolution(resolution)}&l=${limit}&t=${to}`;
        return (0, node_fetch_1.default)(url)
            .then((r) => r.json())
            .then((response) => {
            const bars = [];
            if (response &&
                response.s === 'ok' &&
                response.t &&
                response.t.length > 0) {
                const decimal = 18 + ((outputToken === null || outputToken === void 0 ? void 0 : outputToken.decimal) || 18) - ((inputToken === null || inputToken === void 0 ? void 0 : inputToken.decimal) || 18);
                for (let i = 0; i < response.t.length; i++) {
                    bars.push({
                        low: formatResult((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.l[i]), decimal), barValueType),
                        open: formatResult((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.o[i]), decimal), barValueType),
                        time: response.t[i] * 1000,
                        volume: formatResult((0, helper_1.weiToNumber)(response.v[i].split('.')[0], outputToken === null || outputToken === void 0 ? void 0 : outputToken.decimal), barValueType),
                        close: formatResult((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.c[i]), decimal), barValueType),
                        high: formatResult((0, helper_1.weiToNumber)((0, helper_1.numberToWei)(response.h[i]), decimal), barValueType),
                    });
                }
                return bars;
            }
            else {
                return [];
            }
        })
            .catch((e) => {
            console.error(e);
            return [];
        });
    },
};
const formatResult = (value, type) => {
    if (type === 'string') {
        return value;
    }
    return Number(value);
};
//# sourceMappingURL=historyProvider.js.map