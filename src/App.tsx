import {
  Alert,
  Box,
  Button,
  ButtonProps,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
  Slide,
  Snackbar,
  styled,
  TextField,
} from "@mui/material";
import { blue, green, purple, red } from "@mui/material/colors";
import React, { useEffect, useRef, useState } from "react";
import { Wheel } from "react-custom-roulette";
import { WheelData } from "react-custom-roulette/dist/components/Wheel/types";
import "./App.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate } from "react-router";
import QueryString from "qs";
import { z } from "zod";
import { makeJsonEncoder, makeJsonDecoder } from "@urlpack/json";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import axios from "axios";
import { config } from "./config";
import to from "await-to-js";

const StartButton = styled(Button)<ButtonProps>(({ theme }) => ({
  marginTop: "20px",
  width: "100%",
  fontSize: 20,
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: purple[500],
  "&:hover": {
    backgroundColor: "#fff",
    color: purple[500],
  },
}));

const InitButton = styled(Button)<ButtonProps>(({ theme }) => ({
  width: "100%",
  height: "45px",
  fontSize: 20,
  color: theme.palette.getContrastText(blue[500]),
  backgroundColor: blue[500],
  "&:hover": {
    backgroundColor: "#fff",
    color: blue[500],
  },
}));

const ShareButton = styled(Button)<ButtonProps>(({ theme }) => ({
  width: "100%",
  height: "45px",
  fontSize: 20,
  color: theme.palette.getContrastText(red[500]),
  backgroundColor: red[500],
  "&:hover": {
    backgroundColor: "#fff",
    color: red[500],
  },
}));

const AddButton = styled(Button)<ButtonProps>(({ theme }) => ({
  width: "20%",
  height: "45px",
  fontSize: 15,
  color: theme.palette.getContrastText(green[800]),
  backgroundColor: green[800],
  "&:hover": {
    backgroundColor: "#fff",
    color: green[800],
  },
}));

const queryStringZod = z
  .object({
    data: z.string().optional(),
  })
  .optional();

const wheelDatasZod = z.union([
  z.array(
    z.object({
      option: z.string(),
    })
  ),
  z.array(z.string()),
]);

const shortenUrlResponseZod = z.object({
  data: z.object({
    shortUrl: z.string(),
  }),
});

const jsonEncoder = makeJsonEncoder();
const jsonDecoder = makeJsonDecoder();

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [addValueState, setAddValueState] = useState("");
  const [data, setData] = useState<WheelData[]>([]);
  const addInputText = useRef<any>(null);
  const [noti, setNoti] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isResultShow, setIsResultShow] = useState<boolean>(false);

  useEffect(() => {
    const search = QueryString.parse(location.search, {
      ignoreQueryPrefix: true,
    });

    const searchObj = queryStringZod.parse(search);
    if (searchObj?.data) {
      const decodeObj = jsonDecoder.decode(searchObj.data);
      const parseResult = wheelDatasZod.parse(decodeObj);

      const wheelDatas = parseResult.map((result) => {
        if ((result as WheelData).option) {
          return result as WheelData;
        }

        return { option: result as string };
      });

      setData(wheelDatas);
    }
  }, []);

  const handleSpinClick = () => {
    if (mustSpin || data.length < 2) {
      return;
    }

    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr)

    const newPrizeNumber = arr[0] % data.length;

    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  const getEncodedData = (newData: WheelData[]) => {
    return jsonEncoder.encode(newData.map((data) => data.option));
  };

  const refreshQueryString = (newData: WheelData[]) => {
    const encodeString = getEncodedData(newData);
    if (encodeString.length > 2000) {
      alert("너무 많은 데이터");
      return;
    }
    navigate(`?data=${encodeString}`);
  };

  const handleInitButton = () => {
    if (mustSpin) {
      return;
    }

    setData([]);
    refreshQueryString([]);
    setPrizeNumber(0);
  };

  const handlerSharedButton = () => {
    const asyncHandler = async () => {
      const origin = window.location.origin;
      const encodeString = getEncodedData(data);
      if (encodeString.length > 2000) {
        alert("너무 많은 데이터");
        return;
      }

      const [err, resp] = await to(
        axios.post(config.shortenUrlWorkerUrl, {
          url: `${origin}/?data=${encodeString}`,
        })
      );

      const parsed = shortenUrlResponseZod.safeParse(resp?.data);

      const copyURL = parsed.success
        ? parsed.data.data.shortUrl
        : window.location.href;

      if (navigator.share as any) {
        await navigator.share({
          title: document.title,
          text: `${data
            .map((_data) => _data.option)
            .join(",")
            .substring(0, 10)}... 룰렛`,
          url: copyURL,
        });

        return;
      } else if (navigator.clipboard) {
        const [copyErr] = await to(navigator.clipboard.writeText(copyURL));
        if (copyErr) {
          setNoti({
            type: "error",
            message: "복사 실패, URL을 직접 복사하세요",
          });
          return;
        }

        setNoti({
          type: "success",
          message: "복사 성공",
        });
      }
    };

    asyncHandler();
  };

  const addData = () => {
    if (mustSpin || addValueState.length < 1) return;

    const newData = [
      ...data,
      {
        option: addValueState,
      },
    ];
    setData(newData);
    setAddValueState("");
    refreshQueryString(newData);

    addInputText.current?.focus();
  };

  return (
    <>
      <div className="roulette-layout">
        <div style={{ textAlign: "center" }}>
          <h1>룰렛</h1>
          <Wheel
            mustStartSpinning={mustSpin}
            data={
              data.length > 0
                ? data
                : new Array(4).fill({
                    option: "항목을 추가하세요",
                  })
            }
            prizeNumber={prizeNumber}
            outerBorderWidth={2}
            innerBorderWidth={2}
            radiusLineWidth={3}
            innerRadius={0}
            backgroundColors={["#F99533", "#24CA69", "#46AEFF", "#9145B7"]}
            fontSize={20}
            onStopSpinning={() => {
              setMustSpin(false);
              setIsResultShow(true);
            }}
            spinDuration={0.5}
          ></Wheel>
          <StartButton
            variant="outlined"
            size="large"
            onClick={handleSpinClick}
          >
            시작
          </StartButton>
        </div>
        <div
          style={{
            width: "100px",
          }}
        ></div>
        <div className={"menu-layout"}>
          <div
            style={{
              height: "200px",
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: "100%",
              }}
            >
              <ShareButton onClick={handlerSharedButton}>
                <LinkIcon
                  style={{
                    position: "absolute",
                    left: 10,
                  }}
                />{" "}
                공유하기
              </ShareButton>
            </div>
            <div style={{ height: "10px" }}></div>
            <div
              style={{
                width: "100%",
              }}
            >
              <InitButton onClick={handleInitButton}>초기화</InitButton>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <TextField
              inputRef={addInputText}
              id="add-text"
              label="항목 추가"
              variant="standard"
              InputProps={{ style: { fontSize: 20 } }}
              InputLabelProps={{ style: { fontSize: 20 } }}
              style={{
                width: "80%",
              }}
              value={addValueState}
              onChange={(event) => {
                setAddValueState(event.target.value);
              }}
              onKeyPress={(event) => {
                if (mustSpin || addValueState.length < 1) return;
                if (event.key === "Enter") {
                  addData();
                }
              }}
            />
            <AddButton
              onClick={() => {
                addData();
              }}
            >
              추가하기
            </AddButton>
          </div>
          <div>
            <List>
              {data.map((_data, idx) => {
                return (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          if (mustSpin) return;

                          const tmpData = [...data];
                          tmpData.splice(idx, 1);
                          setData(tmpData);

                          refreshQueryString(tmpData);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <Chip
                      label={idx + 1}
                      style={{
                        marginRight: "5px",
                      }}
                    />
                    <ListItemText primary={_data.option} />
                  </ListItem>
                );
              })}
            </List>
          </div>
        </div>
      </div>
      <Modal
        open={isResultShow}
        onClose={() => {
          setIsResultShow(false);
        }}
        style={{}}
      >
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
            flexDirection: "column",
            backgroundColor: "white",
            width: "40%",
            height: "35%",
            maxWidth: "100vw",
            maxHeight: "100%",
            position: "fixed",
            top: "50%",
            left: "30%",
            transform: "translate(0, -50%)",
            overflowY: "auto",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={() => {
              setIsResultShow(false);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <span style={{ fontSize: "40px" }}>
            {data[prizeNumber] ? data[prizeNumber].option : ""}
          </span>
        </Box>
      </Modal>

      <Snackbar
        open={!!noti}
        onClose={() => {
          setNoti(null);
        }}
        autoHideDuration={3000}
      >
        <Alert severity={noti?.type} variant="filled" sx={{ width: "100%" }}>
          {noti?.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
